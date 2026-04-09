from __future__ import annotations

try:
    import tree_sitter_languages
    _HAS_TREESITTER = True
except ImportError:
    _HAS_TREESITTER = False


def parse_code(code: str, language: str) -> dict:
    lang_map = {"java": "java", "python": "python", "javascript": "javascript", "js": "javascript"}
    lang = lang_map.get(language.lower())
    if not lang or not _HAS_TREESITTER:
        return {"functions": [], "classes": [], "loops": [], "variables": [], "error_prone_patterns": [], "complexity_score": 0, "raw_code": code}

    try:
        parser = tree_sitter_languages.get_parser(lang)
        tree = parser.parse(code.encode("utf-8"))
        root = tree.root_node

        functions = []
        classes = []
        loops = []
        variables = []
        complexity = 0

        def walk(node, depth=0):
            nonlocal complexity
            ntype = node.type

            if ntype in ("method_declaration", "function_definition", "function_declaration"):
                name_node = node.child_by_field_name("name")
                functions.append({
                    "name": name_node.text.decode() if name_node else "anonymous",
                    "line": node.start_point[0] + 1,
                    "end_line": node.end_point[0] + 1,
                })

            if ntype in ("class_declaration", "class_definition"):
                name_node = node.child_by_field_name("name")
                classes.append({
                    "name": name_node.text.decode() if name_node else "anonymous",
                    "line": node.start_point[0] + 1,
                })

            if ntype in ("for_statement", "while_statement", "do_statement", "for_in_statement", "enhanced_for_statement"):
                loops.append({
                    "type": ntype,
                    "line": node.start_point[0] + 1,
                })
                complexity += 1

            if ntype in ("if_statement", "switch_statement", "conditional_expression", "catch_clause"):
                complexity += 1

            if ntype in ("variable_declarator", "assignment"):
                name_node = node.child_by_field_name("name") or node.child_by_field_name("left")
                if name_node:
                    variables.append({
                        "name": name_node.text.decode(),
                        "line": node.start_point[0] + 1,
                    })

            for child in node.children:
                walk(child, depth + 1)

        walk(root)

        return {
            "functions": functions,
            "classes": classes,
            "loops": loops,
            "variables": variables,
            "error_prone_patterns": detect_patterns(root, code, lang),
            "complexity_score": complexity,
        }
    except Exception:
        return {"functions": [], "classes": [], "loops": [], "variables": [], "error_prone_patterns": [], "complexity_score": 0, "raw_code": code}


def detect_patterns(root_node, code: str, language: str) -> list[dict]:
    patterns = []
    lines = code.split("\n")

    def walk(node):
        # Off-by-one: for loops with <= on array length
        if node.type in ("for_statement",):
            text = node.text.decode()
            if "<=" in text and (".length" in text or "len(" in text):
                patterns.append({
                    "pattern_name": "off-by-one",
                    "line": node.start_point[0] + 1,
                    "description": "Array length with <= may cause IndexOutOfBoundsException",
                    "severity": "high",
                })

        # Infinite loop risk: while(true) without break
        if node.type == "while_statement":
            cond = node.child_by_field_name("condition")
            if cond and cond.text.decode().strip("()") in ("true", "True", "1"):
                body = node.child_by_field_name("body")
                if body and "break" not in body.text.decode():
                    patterns.append({
                        "pattern_name": "infinite-loop-risk",
                        "line": node.start_point[0] + 1,
                        "description": "while(true) without break statement",
                        "severity": "critical",
                    })

        # Null check missing: method calls without null guard
        if node.type == "method_invocation" and language == "java":
            obj = node.child_by_field_name("object")
            if obj:
                line_idx = node.start_point[0]
                prev_lines = lines[max(0, line_idx - 3):line_idx]
                obj_name = obj.text.decode()
                has_null_check = any(f"{obj_name} != null" in l or f"{obj_name} == null" in l for l in prev_lines)
                if not has_null_check and obj_name not in ("System.out", "System.err", "this"):
                    patterns.append({
                        "pattern_name": "null-check-missing",
                        "line": node.start_point[0] + 1,
                        "description": f"Method called on '{obj_name}' without null check",
                        "severity": "medium",
                    })

        for child in node.children:
            walk(child)

    walk(root_node)

    # Unused variables (simple heuristic)
    seen_vars = {}

    def collect_vars(node):
        if node.type == "variable_declarator":
            name_node = node.child_by_field_name("name")
            if name_node:
                vname = name_node.text.decode()
                seen_vars[vname] = node.start_point[0] + 1

        for child in node.children:
            collect_vars(child)

    collect_vars(root_node)

    full_code = root_node.text.decode()
    for vname, line in seen_vars.items():
        count = full_code.count(vname)
        if count <= 1 and vname not in ("args", "main"):
            patterns.append({
                "pattern_name": "unused-variable",
                "line": line,
                "description": f"Variable '{vname}' appears to be unused",
                "severity": "low",
            })

    return patterns
