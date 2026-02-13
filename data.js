/**
 * data.js - Main Data & Configuration File
 * Author: Your Brand Name
 * All rights reserved
 */

const siteConfig = {
    // Basic Info
    brandName: "Elite Brands Pakistan",
    brandLogo: "https://cdn-icons-png.flaticon.com/512/3163/3163158.png", // اپنا لوگو تبدیل کریں
    
    // Main Site URL (جو انٹرنل براؤزر میں کھلے گا)
    mainSiteUrl: "https://digitalsiteshub.github.io/",
    
    // Contact Info
    helpContact: "923001234567", // بغیر + کے صرف نمبر
    
    // Developer Info
    devName: "Muhammad Ali",
    devPortfolio: "https://github.com/yourusername",
   
    // Hadith Text
    hadithUrdu: "سچا اور امانت دار تاجر (قیامت کے دن) انبیاء، صدیقین اور شہداء کے ساتھ ہوگا۔ (ترمذی: 1209)",
    hadithEnglish: "\"The honest and trustworthy merchant will be with the prophets, the truthful, and the martyrs.\" (Tirmidhi)",
    
    // Ad Spaces (اپنے ایڈس کے کوڈ یہاں لگائیں)
    adSpaces: {
        space1: '<iframe data-aa="2323232" src="..."></iframe>', // اپنا ایڈس کوڈ یہاں
        space2: '<ins class="adsbygoogle" ...></ins>' // دوسرا ایڈس کوڈ
    }
};

const products = [
    {
        id: 1,
        title: "Luxury Matte Lipstick",
        category: "Cosmetics",
        price: "1,250",
        description: "بہترین میٹ لپ اسٹک جو دیرپا اور واٹر پروف ہے۔ ہونٹوں کو نرم رکھتی ہے اور 12 گھنٹے تک قائم رہتی ہے۔",
        image: "https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=400",
        platforms: [
            { name: "Daraz", url: "https://daraz.pk/product1" },
            { name: "Markaz", url: "https://markaz.app/p1" },
            { name: "WhatsApp", url: "https://wa.me/923001234567?text=I want to buy Lipstick" }
        ]
    },
    {
        id: 2,
        title: "Anti-Aging Serum",
        category: "Skin Care",
        price: "2,500",
        description: "چہرے کی جھریاں ختم کرنے اور چمک لانے کے لیے بہترین سیرم۔ وٹامن سی سے بھرپور۔",
        image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400",
        platforms: [
            { name: "Website Store", url: "https://mysite.com/order" },
            { name: "AliExpress", url: "https://aliexpress.com" }
        ]
    },
    {
        id: 3,
        title: "Leather Wallet",
        category: "Accessories",
        price: "950",
        description: "خالص چمڑے سے بنا پرس، جس میں کارڈز اور کیش کے لیے بہترین جگہ ہے۔ اصلی لیدر۔",
        image: "https://images.unsplash.com/photo-1627123424574-181ce5171c98?w=400",
        platforms: [
            { name: "Daraz", url: "https://daraz.pk/wallet" },
            { name: "WhatsApp", url: "https://wa.me/923001234567?text=I want to buy Wallet" }
        ]
    },
    {
        id: 4,
        title: "Premium Perfume",
        category: "Fragrance",
        price: "3,200",
        description: "لمبے عرصے تک خوشبو دینے والا ڈیزائنر پرفیوم۔ اصلی اور مستند۔",
        image: "https://images.unsplash.com/photo-1594035910387-fea47794261f?w=400",
        platforms: [
            { name: "Website", url: "https://mysite.com/perfume" },
            { name: "WhatsApp", url: "https://wa.me/923001234567?text=I want to buy Perfume" }
        ]
    }
];