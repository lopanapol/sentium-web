#!/usr/bin/env fish

echo "==== Deploying sentium.dev Website ===="
echo ""

cd /Users/lopanapol/git-repos/sentium-pixel

# Check if we have uncommitted changes
git status --porcelain
if test $status -eq 0
    echo "No changes to commit. All files are already committed."
else
    echo "Committing changes for sentium.dev..."
    git add .
    git commit -m "Update for sentium.dev website deployment"
    
    # Push changes
    echo "Pushing changes to GitHub..."
    git push
    
    if test $status -eq 0
        echo "✅ Changes successfully pushed to GitHub!"
    else
        echo "⚠️ There was an issue pushing to GitHub. Please check your remote configuration."
        echo "You may need to run: git push -u origin main"
    end
end

echo ""
echo "==== Next Steps for sentium.dev Setup ===="
echo ""
echo "1. Set up GitHub Pages"
echo "   - Go to your GitHub repository settings"
echo "   - Navigate to 'Pages' section"
echo "   - Set source to 'GitHub Actions'"
echo ""
echo "2. Configure DNS settings at your domain registrar"
echo "   - Add these A records pointing to GitHub Pages:"
echo "     185.199.108.153"
echo "     185.199.109.153"
echo "     185.199.110.153"
echo "     185.199.111.153"
echo ""
echo "   - Add a CNAME record:"
echo "     Host: www"
echo "     Value: lopanapol.github.io"
echo "     (Replace lopanapol with your GitHub username)"
echo ""
echo "3. Wait for DNS propagation"
echo "   - It may take 24-48 hours for DNS changes to fully propagate"
echo "   - You can check status at https://www.whatsmydns.net/"
echo ""
echo "4. Verify HTTPS is working"
echo "   - Visit https://sentium.dev to confirm"
echo ""
echo "==== Setup Complete ===="
