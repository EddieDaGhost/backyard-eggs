# Backyard Eggs Website

A static website for managing backyard egg sales, featuring chicken profiles, batch tracking, and online reservations.

## 📁 Project Structure

```
backyard-eggs/
├── index.html              # Homepage with pricing and egg care info
├── meet-the-flockers.html  # Chicken profiles
├── chicken-fax.html        # Fun facts about chickens
├── batches.html            # Batch tracking page
├── reserve.html            # Reservation form
├── css/
│   └── styles.css          # Main stylesheet
├── js/
│   └── scripts.js          # Mobile navigation
├── images/                 # Folder for chicken photos
└── README.md               # This file
```

## 🎨 Design Features

- **Color Scheme:** Earthy green (#6E7B49) with clean white backgrounds
- **Typography:** Playfair Display (headings) + Open Sans (body)
- **Responsive:** Mobile-first design that works on all devices
- **Accessible:** Semantic HTML with proper ARIA labels

## 📝 Content Pages

1. **Home** - Payment options, egg care instructions, storage tips, freshness testing
2. **Meet The Flockers** - Profiles of all 7 chickens with breed info and egg production details
3. **Chicken Fax** - 10 fun facts about chickens and eggs
4. **Batches** - Track egg batches by lay date (update manually as needed)
5. **Reserve** - Netlify-powered form for egg reservations

## 🚀 Deployment Instructions

### Deploy to Netlify (Recommended)

1. **Create Netlify Account**
   - Go to https://netlify.com
   - Sign up for free account

2. **Deploy Your Site**
   - Option A: Drag & Drop
     - Log into Netlify
     - Drag the `backyard-eggs` folder onto Netlify's deploy zone

   - Option B: Git-based (recommended for easier updates)
     - Install Git if you haven't already
     - Run these commands:
       ```bash
       cd backyard-eggs
       git init
       git add .
       git commit -m "Initial commit"
       ```
     - Create a GitHub repository and push code
     - Connect Netlify to your GitHub repo

3. **Configure Custom Domain**
   - In Netlify: Domain settings → Add custom domain
   - Enter your domain name from Name.com
   - Netlify will provide DNS records

4. **Update Name.com DNS**
   - Log into Name.com
   - Go to "My Domains" → Select your domain
   - Click "Manage DNS Records"
   - Add these records:
     - **A Record:** @ → `75.2.60.5`
     - **CNAME Record:** www → `your-site.netlify.app`
   - Remove any conflicting records
   - Wait for DNS propagation (30 minutes - 24 hours)

5. **Enable HTTPS**
   - In Netlify: Domain settings → HTTPS
   - Enable "Force HTTPS" once SSL certificate is provisioned

## 📬 Form Handling

The reservation form uses **Netlify Forms** (included free):
- Automatically captures form submissions
- Sends email notifications
- Stores submissions in Netlify dashboard
- Includes spam protection with honeypot field

**To access form submissions:**
1. Log into Netlify
2. Select your site
3. Go to Forms tab
4. View submissions and set up email notifications

## 🖼️ Adding Chicken Photos

To replace the placeholder gradients with real photos:

1. Save your chicken photos to the `images/` folder
2. Name them descriptively (e.g., `beyonce.jpg`, `kesha.jpg`)
3. Edit `meet-the-flockers.html`
4. Replace the placeholder divs with:
   ```html
   <img src="images/beyonce.jpg" alt="Beyoncé the Black Ameraucana">
   ```

## ✏️ Updating Content

### Update Batch Information
Edit `batches.html` and add new batch items:
```html
<div class="batch-item">
    <strong>#03</strong> - Laid between <strong>02/15/2026 - 02/21/2026</strong>
</div>
```

### Update Payment Info
Edit `index.html` and modify the payment box section

### Update Chicken Info
Edit `meet-the-flockers.html` to add/remove chickens or update descriptions

## 🧪 Local Testing

To test locally before deploying:

1. Simply open `index.html` in your web browser
2. Or use a local server (recommended):
   ```bash
   # If you have Python installed:
   python -m http.server 8000
   # Then open http://localhost:8000
   ```

## 📱 Browser Support

- Chrome, Firefox, Safari, Edge (latest versions)
- Mobile browsers (iOS Safari, Chrome Mobile)
- Fully responsive design for phones, tablets, desktops

## 🆘 Troubleshooting

**Form not working?**
- Make sure you deployed to Netlify (forms only work on Netlify, not locally)
- Check that `data-netlify="true"` is in the form tag

**CSS not loading?**
- Check that file paths are correct (case-sensitive)
- Verify `css/styles.css` exists

**Mobile menu not working?**
- Check that `js/scripts.js` is loading
- Look for JavaScript errors in browser console

## 📧 Support

For questions or issues, refer to:
- Netlify Docs: https://docs.netlify.com
- Name.com DNS Guide: https://www.name.com/support/articles/205188538-Pointing-your-domain-to-hosting-with-A-records

---

**Made with ❤️ for happy chickens and egg lovers!**
