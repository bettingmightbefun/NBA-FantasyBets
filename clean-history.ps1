# PowerShell script to clean MongoDB URI from Git history
Write-Host "Starting to clean sensitive data from Git history..."

# Install git-filter-repo if not already installed
# Note: You may need to install Python and pip first if not already installed
# pip install git-filter-repo

# Create a pattern file for the MongoDB URI
$patternFile = "sensitive-patterns.txt"
"mongodb\+srv://matt:matt@cluster0.66xpj.mongodb.net" | Out-File -FilePath $patternFile

Write-Host "Created pattern file for sensitive data"

# Backup the repository before making changes
Write-Host "It's recommended to make a backup of your repository before proceeding."
$continue = Read-Host "Do you want to continue? (y/n)"

if ($continue -ne "y") {
    Write-Host "Operation cancelled."
    exit
}

# Run git filter-repo to replace sensitive data
Write-Host "Running git filter-repo to clean sensitive data..."
Write-Host "Note: You need to have git-filter-repo installed. If you don't have it, please install it first."
Write-Host "You can install it with: pip install git-filter-repo"

Write-Host "Command to run manually after installing git-filter-repo:"
Write-Host "git-filter-repo --replace-text sensitive-patterns.txt"

Write-Host "After running the command, you'll need to force push with:"
Write-Host "git push origin --force --all"

Write-Host "Script completed. Please follow the manual steps above." 