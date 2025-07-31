#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Generates all variants of a given string for replacement
 * @param {string} str - The original string
 * @returns {Array<string>} Array of string variants
 */
function generateVariants(str) {
    const variants = [];

    // Original string
    variants.push(str);

    // Uppercase
    variants.push(str.toUpperCase());

    // Snake case (spaces to underscores)
    variants.push(str.toLowerCase().replace(/\s+/g, '_'));

    // Upper snake case
    variants.push(str.toUpperCase().replace(/\s+/g, '_'));

    // Hyphen case (spaces to hyphens)
    variants.push(str.toLowerCase().replace(/\s+/g, '-'));

    // Upper hyphen case
    variants.push(str.toUpperCase().replace(/\s+/g, '-'));

    // Camel case
    const camelCase = str.toLowerCase().replace(/\s+(.)/g, (match, letter) => letter.toUpperCase());
    variants.push(camelCase);

    // Pascal case
    const pascalCase = str.toLowerCase().replace(/(?:^|\s+)(.)/g, (match, letter) => letter.toUpperCase()).replace(/\s+/g, '');
    variants.push(pascalCase);

    // Title case
    const titleCase = str.replace(/\b\w/g, letter => letter.toUpperCase());
    variants.push(titleCase);

    // Lowercase no spaces
    variants.push(str.toLowerCase().replace(/\s+/g, ''));

    // Uppercase no spaces
    variants.push(str.toUpperCase().replace(/\s+/g, ''));

    // Remove duplicates while preserving order
    return [...new Set(variants)];
}

/**
 * Preserves the case pattern from the original text when replacing
 * @param {string} original - The original text being replaced
 * @param {string} replacement - The replacement text
 * @returns {string} Case-preserved replacement
 */
function preserveCase(original, replacement) {
    if (original.length === 0) return replacement;
    if (replacement.length === 0) return replacement;

    // Only apply case preservation to the first character
    const firstOriginalChar = original[0];
    const firstReplacementChar = replacement[0];

    if (firstOriginalChar && firstOriginalChar === firstOriginalChar.toUpperCase() && firstOriginalChar !== firstOriginalChar.toLowerCase()) {
        // First character of original is uppercase, so make first character of replacement uppercase
        return firstReplacementChar.toUpperCase() + replacement.slice(1);
    } else {
        // First character of original is lowercase or not a letter, so make first character of replacement lowercase
        return firstReplacementChar.toLowerCase() + replacement.slice(1);
    }
}

/**
 * Checks if a folder should be ignored
 * @param {string} folderName - The folder name to check
 * @returns {boolean} True if folder should be ignored
 */
function shouldIgnoreFolder(folderName) {
    const ignoredFolders = ['.git', 'bin', 'obj', 'node_modules', 'dist'];
    return ignoredFolders.includes(folderName);
}

/**
 * Replaces text in file content with case preservation
 * @param {string} filePath - Path to the file
 * @param {Array<string>} searchVariants - Array of search variants
 * @param {string} replaceWith - Text to replace with
 * @returns {boolean} True if any replacements were made
 */
function replaceInFileContent(filePath, searchVariants, replaceWith) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        let hasChanges = false;

        for (const searchText of searchVariants) {
            const regex = new RegExp(escapeRegExp(searchText), 'g');
            const matches = content.match(regex);

            if (matches) {
                content = content.replace(regex, (match) => {
                    hasChanges = true;
                    const replacement = preserveCase(match, replaceWith);
                    console.log(`   📄 File content: "${match}" → "${replacement}"`);
                    return replacement;
                });
            }
        }

        if (hasChanges) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`✓ Updated content in: ${filePath}`);
        }

        return hasChanges;
    } catch (error) {
        console.error(`✗ Error processing file content ${filePath}:`, error.message);
        return false;
    }
}

/**
 * Escapes special regex characters
 * @param {string} string - String to escape
 * @returns {string} Escaped string
 */
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Renames a file or folder if it contains any of the search variants
 * @param {string} itemPath - Full path to the item
 * @param {Array<string>} searchVariants - Array of search variants
 * @param {string} replaceWith - Text to replace with
 * @returns {string|null} New path if renamed, null otherwise
 */
function renameIfMatches(itemPath, searchVariants, replaceWith) {
    const itemName = path.basename(itemPath);
    let newName = itemName;
    let hasChanges = false;

    for (const searchText of searchVariants) {
        const regex = new RegExp(escapeRegExp(searchText), 'g');
        const matches = newName.match(regex);

        if (matches) {
            newName = newName.replace(regex, (match) => {
                hasChanges = true;
                const replacement = preserveCase(match, replaceWith);
                console.log(`   📂 File/folder name: "${match}" → "${replacement}"`);
                return replacement;
            });
        }
    }

    if (hasChanges) {
        const newPath = path.join(path.dirname(itemPath), newName);
        try {
            fs.renameSync(itemPath, newPath);
            console.log(`✓ Renamed: ${itemName} → ${newName}`);
            return newPath;
        } catch (error) {
            console.error(`✗ Error renaming ${itemPath}:`, error.message);
            return null;
        }
    }

    return null;
}

/**
 * Recursively processes directories and files
 * @param {string} dirPath - Directory path to process
 * @param {Array<string>} searchVariants - Array of search variants
 * @param {string} replaceWith - Text to replace with
 */
function processDirectory(dirPath, searchVariants, replaceWith) {
    try {
        const items = fs.readdirSync(dirPath);

        // Process items in two passes:
        // 1. First pass: process files and collect directories
        // 2. Second pass: process directories (after potential renaming)

        const directories = [];
        const files = [];

        for (const item of items) {
            const fullPath = path.join(dirPath, item);
            const stats = fs.statSync(fullPath);

            if (stats.isDirectory()) {
                if (!shouldIgnoreFolder(item)) {
                    directories.push(fullPath);
                }
            } else if (stats.isFile()) {
                files.push(fullPath);
            }
        }

        // Process files first
        for (const filePath of files) {
            // Replace content in file
            replaceInFileContent(filePath, searchVariants, replaceWith);

            // Rename file if needed
            renameIfMatches(filePath, searchVariants, replaceWith);
        }

        // Process directories
        for (const dirPath of directories) {
            // Rename directory if needed
            const newDirPath = renameIfMatches(dirPath, searchVariants, replaceWith);
            const pathToProcess = newDirPath || dirPath;

            // Recursively process the directory
            processDirectory(pathToProcess, searchVariants, replaceWith);
        }

    } catch (error) {
        console.error(`✗ Error processing directory ${dirPath}:`, error.message);
    }
}

/**
 * Main function
 */
function main() {
    const args = process.argv.slice(2);

    if (args.length < 3) {
        console.log('Usage: node rename-replace.js <root-path> <search-text> <replace-text>');
        console.log('');
        console.log('Example: node rename-replace.js ./src "bjj video" "mma training"');
        console.log('');
        console.log('This will replace all variants of "bjj video" including:');
        console.log('- bjj video (original)');
        console.log('- BJJ VIDEO (uppercase)');
        console.log('- bjj_video (snake_case)');
        console.log('- BJJ_VIDEO (UPPER_SNAKE_CASE)');
        console.log('- bjj-video (kebab-case)');
        console.log('- BJJ-VIDEO (UPPER-KEBAB-CASE)');
        console.log('- bjjVideo (camelCase)');
        console.log('- BjjVideo (PascalCase)');
        console.log('- BJJ Video (Title Case)');
        console.log('- bjjvideo (lowercasenospace)');
        console.log('- BJJVIDEO (UPPERCASENOSPACE)');
        process.exit(1);
    }

    const rootPath = path.resolve(args[0]);
    const searchText = args[1];
    const replaceWith = args[2];

    if (!replaceWith.trim()) {
        console.error('✗ Replacement text cannot be empty');
        process.exit(1);
    }

    // Validate root path
    if (!fs.existsSync(rootPath)) {
        console.error(`✗ Root path does not exist: ${rootPath}`);
        process.exit(1);
    }

    if (!fs.statSync(rootPath).isDirectory()) {
        console.error(`✗ Root path is not a directory: ${rootPath}`);
        process.exit(1);
    }

    console.log(`\n🔍 Searching for: "${searchText}"`);
    console.log(`📝 Replacing with: "${replaceWith}"`);
    console.log(`📁 Root path: ${rootPath}`);

    // Generate search variants
    const searchVariants = generateVariants(searchText);
    console.log(`\n🔄 Generated ${searchVariants.length} variants to search for:`);
    searchVariants.forEach((variant, index) => {
        console.log(`   ${index + 1}. "${variant}"`);
    });

    console.log('\n🚀 Starting replacement process...\n');

    // Start processing
    const startTime = Date.now();
    processDirectory(rootPath, searchVariants, replaceWith);
    const endTime = Date.now();

    console.log(`\n✅ Replacement process completed in ${endTime - startTime}ms`);
}

// Run the script
if (require.main === module) {
    main();
}
