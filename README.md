# Rename Replace Script

A Node.js script that replaces text in file and folder names, and file contents with intelligent case preservation and variant generation. This can be used for copying template software source code with any reference to a previous project name replaced.

## Features

- **Case Preservation**: Like VS Code's 'Preserve Case' option (Alt + P)
- **Multiple Variants**: Automatically generates and replaces multiple string variants
- **Recursive Search**: Searches through all subdirectories
- **Smart Ignoring**: Ignores common folders (`.git`, `bin`, `obj`, `node_modules`, `dist`)
- **Safe Operation**: Processes files first, then renames to avoid path conflicts

## String Variants Generated

The generation of string variants means that you should not need to perform multiple replaces to capture differnt variants of the same word formatted in different cases for use in plain text, variable names and file or folder names.

For input string "bjj video", the script will search and replace:

1. `bjj video` (original string)
2. `BJJ VIDEO` (uppercase)
3. `bjj_video` (snake_case)
4. `BJJ_VIDEO` (UPPER_SNAKE_CASE)
5. `bjj-video` (kebab-case)
6. `BJJ-VIDEO` (UPPER-KEBAB-CASE)
7. `bjjVideo` (camelCase)
8. `BjjVideo` (PascalCase)
9. `BJJ Video` (Title Case)
10. `bjjvideo` (lowercasenospace)
11. `BJJVIDEO` (UPPERCASENOSPACE)

## Usage

```bash
node rename-replace.js <root-path> <search-text> <replace-text>
```

### Examples

```bash
# Replace "bjj video" and its variants with "mma training" in the current directory
node rename-replace.js . "bjj video" "mma training"

# Replace in a specific directory
node rename-replace.js ./src "old project name" "new project name"

# Replace with spaces in both search and replace text
node rename-replace.js /path/to/project "my old component" "my new component"
```

When you run the script, it will:
1. Show you all the variants it will search for
2. Process all files and folders recursively
3. Display each replacement as it happens, showing old → new text
4. Display progress as it makes changes

## Case Preservation Examples

Case preservation applies only to the first character of the text replacement.


## Requirements

- Node.js 12.0.0 or higher
- Read/write permissions for the target directory

## Ignored Folders

The following folders are automatically ignored during processing:
- `.git`
- `bin`
- `obj` 
- `node_modules`
- `dist`

## Safety Notes

- Always backup your files before running the script
- Test on a small directory first
- The script preserves original case patterns
- File content encoding is assumed to be UTF-8

## License

MIT
