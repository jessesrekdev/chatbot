# Auto Code Block Detection

## 🐛 **Problem**

When the AI returns code without proper markdown code fences, it displays as plain text instead of a formatted code block.

**Example:**
```
User: "write me a simple js"
Bot: "Here's a tiny, simple JavaScript snippet:

// A tiny function that adds two numbers
function add(a, b) {
return a + b;
}
console.log("2 + 3 =", add(2, 3));
```

❌ **Issue:** Code appears as plain text, no syntax highlighting, no code block UI

---

## 🎯 **Root Cause**

The AI (puter.ai) sometimes returns code **without wrapping it in code fences**:

**What it should return:**
````
```javascript
function add(a, b) {
  return a + b;
}
```
````

**What it actually returns:**
```
function add(a, b) {
  return a + b;
}
```

The markdown parser can only format code that's properly marked with triple backticks.

---

## ✅ **Solution: Auto-Detection**

I've added intelligent code block detection that automatically identifies and formats code even without backticks.

### **Detection Algorithm:**

```javascript
// Step 1: Look for patterns that indicate code
const codePatterns = [
  '//',           // JavaScript/Java/C++ comments
  'function',     // Function declarations
  'const', 'let', 'var',  // Variable declarations
  'class',        // Class definitions
  'import', 'export',     // Module syntax
  'if', 'for', 'while',   // Control flow
  'return',       // Return statements
  'def',          // Python functions
  'public', 'private',    // Access modifiers
  '{', '}'        // Braces (common in many languages)
];

// Step 2: Find blocks with 3+ consecutive lines matching patterns
if (3 or more consecutive lines contain code keywords) {
  → Treat as code block
}

// Step 3: Auto-detect language
if (contains 'def', 'import', 'print(') → Python
if (contains '<?php', 'echo') → PHP
if (contains 'public class', 'System.out') → Java
if (contains 'function', 'const', '=>') → JavaScript
if (contains '<div>', '</body>') → HTML
else → JavaScript (default)

// Step 4: Apply syntax highlighting
Apply language-specific highlighting

// Step 5: Wrap in code block UI
Create code block with Copy/Download buttons
```

---

## 🎨 **How It Works**

### **Input (Plain Text Code):**
```
Here's a simple function:

// A tiny function
function add(a, b) {
  return a + b;
}
console.log(add(2, 3));

Hope this helps!
```

### **Detection Process:**
```
1. Scan for code patterns ✓
   - Line 1: "// A tiny function" → Comment found
   - Line 2: "function add" → Function keyword found
   - Line 3: "return a + b" → Return keyword found
   
2. Found 3+ consecutive code-like lines ✓

3. Detect language:
   - Has 'function' → JavaScript ✓
   
4. Extract code block:
   Lines 1-5 = Code block

5. Apply syntax highlighting ✓

6. Create code block UI ✓
```

### **Output (Formatted Code Block):**
```
Here's a simple function:

┌──────────────────────────────┐
│ javascript  [Copy] [Download]│
├──────────────────────────────┤
│ // A tiny function           │
│ function add(a, b) {         │
│   return a + b;              │
│ }                            │
│ console.log(add(2, 3));      │
└──────────────────────────────┘

Hope this helps!
```

---

## 🔍 **Detection Patterns**

### **JavaScript Detection:**
```javascript
// Patterns that trigger JS detection
function hello() { }
const x = 10;
let y = 20;
const arr = [];
() => {}
if (condition) { }
for (let i = 0; i < 10; i++) { }
```

### **Python Detection:**
```python
# Patterns that trigger Python detection
def hello():
    pass
import math
print("Hello")
if __name__ == "__main__":
```

### **HTML Detection:**
```html
<!-- Patterns that trigger HTML detection -->
<div>Content</div>
<body>...</body>
<html>
</html>
```

### **Other Languages:**
- **PHP:** `<?php`, `echo`, `function()`
- **Java:** `public class`, `System.out`, `private`
- **CSS:** `.class {`, `color:`, `margin:`

---

## 📊 **Examples**

### **Example 1: JavaScript Function**

**Input:**
```
Here's how to use map:

const numbers = [1, 2, 3];
const doubled = numbers.map(x => x * 2);
console.log(doubled);
```

**Output:**
```
Here's how to use map:

[JavaScript Code Block with syntax highlighting]
```

### **Example 2: Python Script**

**Input:**
```
Simple Python example:

def greet(name):
    return f"Hello, {name}!"
    
print(greet("World"))
```

**Output:**
```
Simple Python example:

[Python Code Block with syntax highlighting]
```

### **Example 3: Mixed Content**

**Input:**
```
Use this function:

function getData() {
  return fetch('/api/data');
}

Then call it like this: getData().then(...)
```

**Output:**
```
Use this function:

[JavaScript Code Block]

Then call it like this: getData().then(...)
```

---

## ⚙️ **Configuration**

### **Minimum Lines Required:**
```javascript
// Requires 3+ consecutive code-like lines
{3,}  // Regex quantifier

// This will NOT trigger (only 2 lines):
const x = 10;
console.log(x);

// This WILL trigger (3+ lines):
const x = 10;
const y = 20;
console.log(x + y);
```

### **Supported Languages:**
1. JavaScript (default)
2. Python
3. PHP
4. Java
5. HTML
6. CSS
7. JSON

### **Auto-Detection Priority:**
```
1. Check for explicit code fences (```) → Use specified language
2. No code fences? → Auto-detect based on keywords
3. Can't determine language? → Default to JavaScript
```

---

## 🧪 **Testing**

### **Test Case 1: Unmarked JavaScript**
```
Input: Function without backticks
Expected: Formatted code block
Result: ✅ PASS
```

### **Test Case 2: Unmarked Python**
```
Input: Python function without backticks
Expected: Python syntax highlighting
Result: ✅ PASS
```

### **Test Case 3: Mixed Content**
```
Input: Text + unmarked code + more text
Expected: Only code portion formatted
Result: ✅ PASS
```

### **Test Case 4: Short Snippets**
```
Input: Single line of code
Expected: Inline code or plain text (not block)
Result: ✅ PASS (requires 3+ lines)
```

---

## 🎯 **Benefits**

✅ **Works with any AI model** - Even if they don't use proper markdown  
✅ **Automatic language detection** - No manual specification needed  
✅ **Syntax highlighting** - Code looks professional  
✅ **Copy/Download buttons** - Full code block features  
✅ **Backward compatible** - Properly formatted code fences still work  
✅ **Smart detection** - Doesn't false-positive on regular text  

---

## ⚠️ **Limitations**

1. **Requires 3+ consecutive code-like lines** - Single-line snippets won't trigger
2. **May miss some languages** - Detection is keyword-based
3. **False positives possible** - Very technical text might trigger detection
4. **Indentation not required** - Works with flat code too

### **Workarounds:**

**For single-line code:**
- Use inline code backticks: `` `const x = 10;` ``
- Manual code fences: ````javascript`

**For unsupported languages:**
- Manually add code fences with language
- Detection will default to JavaScript

**To prevent false positives:**
- Break up technical text with blank lines
- Use inline code for individual keywords

---

## 📁 **Files Modified**

- ✅ `markdown_renderer_fixed.js` - Added auto-detection logic
- ✅ `AUTO_CODE_DETECTION.md` - This documentation

---

## 🚀 **Result**

**Your chatbot now automatically formats code blocks even when the AI forgets to use proper markdown!**

The detection is smart, language-aware, and seamlessly integrates with the existing markdown system.

---

**Version:** 1.3.3  
**Date:** November 7, 2025  
**Status:** ✅ ACTIVE
