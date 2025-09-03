#!/bin/bash

echo "Fixing Next.js 15 compatibility issues..."

# Function to fix a file
fix_file() {
    local file="$1"
    echo "Fixing $file..."
    
    # Fix params usage - replace useEffect with direct await
    sed -i '' 's/useEffect(() => {\s*const extractId = async () => {\s*const resolvedParams = await params;\s*set[^;]*Id\(resolvedParams\.id\);\s*};\s*extractId\(\);\s*}, \[params\]);/const resolvedParams = await params;\n  const { id: \1IdFromParams } = resolvedParams;/g' "$file"
    
    # Fix function declarations to be async
    sed -i '' 's/export default function \([^(]*\)({ params }: { params: Promise<{ id: string }> })/export default async function \1({ params }: { params: Promise<{ id: string }> })/g' "$file"
    
    # Fix searchParams to be Promise type
    sed -i '' 's/searchParams: { \([^}]*\) }/searchParams: Promise<{ \1 }>/g' "$file"
    
    # Fix usage of searchParams to await it
    sed -i '' 's/const date = searchParams\.date/const resolvedSearchParams = await searchParams;\n  const date = resolvedSearchParams.date/g' "$file"
}

# Find and fix all page files with params
find src/app -name "*.tsx" -type f -exec grep -l "export default function.*params" {} \; | while read file; do
    fix_file "$file"
done

echo "Next.js 15 compatibility fixes completed!"
echo "Note: Some files may have additional linter errors that need manual fixing."
echo "Run 'npm run build' to check for remaining issues."
