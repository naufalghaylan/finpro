const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');
const pages = [
    'VerifyAccountPage', 'ForgotPasswordPage', 'ResetPasswordPage', 'ProfilePage',
    'SocialOnboardingPage', 'CartPage', 'CheckoutPage', 'PaymentPage', 'OrdersPage',
    'CatalogPage', 'SearchPage', 'ProductDetailPage', 'AdminCategoryPage',
    'AdminProductPage', 'AdminStoreAdminList', 'AdminStockList', 'AdminOrderList',
    'AdminSalesReport', 'AdminStockReport', 'NotFoundPage', 'AdminUserPage'
];
pages.forEach(page => {
    // import PageName from './some/path'
    const importRegex = new RegExp(`import ${page} from '([^']+)'`, 'g');
    content = content.replace(importRegex, `const ${page} = lazy(() => import('$1'))`);
    
    // <PageName />
    // Wait, some are already wrapped in Suspense (like AdminStockList).
    // Let's check if it's already wrapped.
    // If it is `<Suspense fallback={<PageLoader />}><PageName /></Suspense>`, we shouldn't wrap it again.
    // We can just regex replace `<PageName />` that isn't preceded by `<Suspense...>`
    // The easiest way is to wrap all of them, and then deduplicate `<Suspense...><Suspense...>`
    
    const elementRegex = new RegExp(`<${page} />`, 'g');
    content = content.replace(elementRegex, `<Suspense fallback={<PageLoader />}><${page} /></Suspense>`);
});

// Clean up duplicate Suspense if any
const duplicateSuspense = /<Suspense fallback=\{<PageLoader \/>\}><Suspense fallback=\{<PageLoader \/>\}>([^<]+)<\/Suspense><\/Suspense>/g;
content = content.replace(duplicateSuspense, `<Suspense fallback={<PageLoader />}>$1</Suspense>`);

fs.writeFileSync('src/App.tsx', content);
console.log('Replaced successfully!');
