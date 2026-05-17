import sys
import re

def deduplicate_java(file_content):
    # Find all method definitions
    # This regex is simplified and might need adjustment for more complex cases
    # but for standard getters/setters it should work.
    # It looks for public [ReturnType] [MethodName]([Args]) { ... }
    
    # We want to identify the getters and setters specifically.
    # Pattern: public [Type] (get|set)[Name]([Args]) { [Body] }
    
    # For simplicity and to be safe, I'll split the file by methods and identifiers.
    # However, a robust way is to find segments that look like getters/setters.
    
    # Let's try to identify where the builder class is and keep it aside.
    builder_match = re.search(r'public static class \w+Builder \{.*?\n    \}', file_content, re.DOTALL)
    builder_content = builder_match.group(0) if builder_match else ""
    
    if builder_content:
        content_no_builder = file_content.replace(builder_content, "BUILDER_PLACEHOLDER")
    else:
        content_no_builder = file_content

    # Regex for standard getters and setters
    # public void setId(Long id) { this.id = id; }
    # public Long getId() { return id; }
    method_pattern = re.compile(r'    public [^}]+\}\n?', re.DOTALL)
    
    methods = method_pattern.findall(content_no_builder)
    
    seen_methods = {} # signature -> full_method_text
    deduplicated_methods = []
    
    # Non-method content (fields, class decl, etc.)
    # This is tricky with regex. Let's try a different approach.
    
    lines = content_no_builder.splitlines()
    new_lines = []
    i = 0
    while i < len(lines):
        line = lines[i]
        # Match start of a method: public [Type] [MethodName]([Args]) {
        match = re.match(r'^\s+public\s+[\w<>]+\s+(\w+)\s*\(.*\)\s*\{', line)
        if match:
            method_name = match.group(1)
            # Find the end of the method
            method_block = [line]
            j = i + 1
            brace_count = 1
            while j < len(lines) and brace_count > 0:
                method_block.append(lines[j])
                brace_count += lines[j].count('{')
                brace_count -= lines[j].count('}')
                j += 1
            
            full_method = "\n".join(method_block)
            # Use method signature (name and params) as key
            signature_match = re.match(r'^\s+public\s+[\w<>]+\s+(\w+\s*\(.*\))', line)
            signature = signature_match.group(1) if signature_match else full_method
            
            if signature not in seen_methods:
                seen_methods[signature] = full_method
                new_lines.append(full_method)
            
            i = j
        else:
            new_lines.append(line)
            i += 1
            
    final_content = "\n".join(new_lines)
    if "BUILDER_PLACEHOLDER" in final_content:
        final_content = final_content.replace("BUILDER_PLACEHOLDER", builder_content)
        
    return final_content

if __name__ == "__main__":
    filepath = sys.argv[1]
    with open(filepath, 'r') as f:
        content = f.read()
    
    new_content = deduplicate_java(content)
    
    with open(filepath, 'w') as f:
        f.write(new_content)
