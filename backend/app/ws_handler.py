"""
API Gateway WebSocket Lambda handler.
Manages connections via DynamoDB instead of Redis.
"""
import json
import os
import logging
from datetime import datetime, timezone

import boto3

logger = logging.getLogger()
logger.setLevel(logging.INFO)

dynamodb = boto3.resource("dynamodb", region_name=os.environ.get("AWS_REGION", "ap-northeast-2"))
connections_table = dynamodb.Table(os.environ.get("CONNECTIONS_TABLE", "codepath-ws-connections"))
heartbeat_table = dynamodb.Table(os.environ.get("HEARTBEAT_TABLE", "codepath-heartbeat"))


def get_apigw_client(event):
    domain = event["requestContext"]["domainName"]
    stage = event["requestContext"]["stage"]
    return boto3.client(
        "apigatewaymanagementapi",
        endpoint_url=f"https://{domain}/{stage}",
    )


def handler(event, context):
    route_key = event["requestContext"]["routeKey"]
    connection_id = event["requestContext"]["connectionId"]

    if route_key == "$connect":
        return on_connect(event, connection_id)
    elif route_key == "$disconnect":
        return on_disconnect(connection_id)
    elif route_key == "$default":
        return on_message(event, connection_id)

    return {"statusCode": 200}


def on_connect(event, connection_id):
    query = event.get("queryStringParameters") or {}
    student_id = query.get("student_id")
    course_id = query.get("course_id")
    role = query.get("role", "student")
    name = query.get("name", "")

    item = {
        "connectionId": connection_id,
        "role": role,
        "connectedAt": datetime.now(timezone.utc).isoformat(),
    }
    if student_id:
        item["studentId"] = int(student_id)
        item["name"] = name
    if course_id:
        item["courseId"] = int(course_id)

    connections_table.put_item(Item=item)
    logger.info(f"Connected: {connection_id}, role={role}")
    return {"statusCode": 200}


def on_disconnect(connection_id):
    connections_table.delete_item(Key={"connectionId": connection_id})
    logger.info(f"Disconnected: {connection_id}")
    return {"statusCode": 200}


def on_message(event, connection_id):
    body = json.loads(event.get("body", "{}"))
    msg_type = body.get("type")

    if msg_type == "ping":
        apigw = get_apigw_client(event)
        send_to_connection(apigw, connection_id, {"type": "pong"})
        return {"statusCode": 200}

    if msg_type == "heartbeat":
        return handle_heartbeat(event, connection_id, body)

    if msg_type == "request_hint":
        return handle_hint_request(event, connection_id, body)

    return {"statusCode": 200}


def handle_heartbeat(event, connection_id, body):
    # Get connection info
    conn = connections_table.get_item(Key={"connectionId": connection_id}).get("Item", {})
    student_id = conn.get("studentId")
    if not student_id:
        return {"statusCode": 200}

    # Save heartbeat state
    hb_event = body.get("event", "unknown")
    hb_data = body.get("data", {})

    heartbeat_table.put_item(Item={
        "studentId": student_id,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "event": hb_event,
        "data": json.dumps(hb_data),
        "connectionId": connection_id,
        "name": conn.get("name", f"Student {student_id}"),
        "courseId": conn.get("courseId", 0),
    })

    # Broadcast to instructor dashboards
    course_id = conn.get("courseId")
    if course_id:
        broadcast_heartbeat_to_dashboards(event, course_id)

    return {"statusCode": 200}


def broadcast_heartbeat_to_dashboards(event, course_id):
    # Find all dashboard connections for this course
    response = connections_table.scan(
        FilterExpression="role = :role AND courseId = :cid",
        ExpressionAttributeValues={":role": "dashboard", ":cid": course_id},
    )
    dashboard_conns = response.get("Items", [])

    # Get all student heartbeat data
    hb_response = heartbeat_table.scan(
        FilterExpression="courseId = :cid",
        ExpressionAttributeValues={":cid": course_id},
    )
    students_data = {}
    for item in hb_response.get("Items", []):
        sid = item["studentId"]
        students_data[sid] = {
            "id": sid,
            "name": item.get("name", f"Student {sid}"),
            "status": "normal",
            "stall_min": 0,
            "errors": 0,
        }

    payload = {
        "type": "heartbeat_update",
        "students": list(students_data.values()),
    }

    apigw = get_apigw_client(event)
    for conn in dashboard_conns:
        send_to_connection(apigw, conn["connectionId"], payload)


def handle_hint_request(event, connection_id, body):
    level = min(body.get("hint_level", 1), 4)
    hint = {
        "type": "hint",
        "message": get_fallback_hint(level),
        "hint_level": level,
        "related_line": None,
    }
    apigw = get_apigw_client(event)
    send_to_connection(apigw, connection_id, hint)
    return {"statusCode": 200}


def get_fallback_hint(level):
    hints = {
        1: "코드를 한번 천천히 읽어보세요. 어떤 부분이 헷갈리나요?",
        2: "변수의 값이 반복문에서 어떻게 변하는지 추적해보세요.",
        3: "비슷한 간단한 예제를 먼저 만들어보면 어떨까요?",
        4: "핵심 로직만 남기고 나머지를 지워보세요. 어디서 문제가 생기나요?",
    }
    return hints.get(level, hints[1])


def send_to_connection(apigw, connection_id, data):
    try:
        apigw.post_to_connection(
            ConnectionId=connection_id,
            Data=json.dumps(data, ensure_ascii=False).encode("utf-8"),
        )
    except apigw.exceptions.GoneException:
        connections_table.delete_item(Key={"connectionId": connection_id})
    except Exception as e:
        logger.warning(f"Failed to send to {connection_id}: {e}")
