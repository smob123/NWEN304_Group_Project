/**
 * app's main routes
 */

const router = require('express').Router();
const ProductQueries = require('../../dbQueries/products');
const ProductSchema = require('../../models/productModle');
const User = require('../../models/User')
//middleware that checks if user is logged in or if they are admin
const { authRole, userLogin } = require('../api/roles')

const CartQueries = require('../../dbQueries/cart');

// web service routes
router.get('/', async (req, res) => {
    const products = await ProductQueries.getRandomProducts(10);
    res.render('index', { products, user: req.user || req.session.user });
})

router.get('/products/:productType', async (req, res) => {

    let productName = req.params.productType.charAt(0).toUpperCase();
    productName += req.params.productType.slice(1).toLowerCase();
    const products = await ProductQueries.getProductsByType(productName);

    if (products.length > 0) {
        res.render('products', { productType: productName, products, user: req.user || req.session.user });
    } else {
        res.json('no products were found');
    }
})

router.get('/cart', userLogin, async (req, res) => {
    const userInfo = req.user || req.session.user;
    const items = await CartQueries.getUsersCart(userInfo.id, userInfo.jwt);

    res.render('cart', {
        items, user: req.user || req.session.user
    });
})

// authentication routes
router.get('/login', (req, res) => {
    if (req.user || (req.session && req.session.user)) {
        res.redirect('/');
    } else {
        res.render('login', { user: null });
    }
});

router.get('/signup', (req, res) => {
    if (req.user || (req.session && req.session.user)) {
        res.redirect('/');
    } else {
        res.render('signup', { user: null });
    }
});

router.get('/logout', (req, res) => {
    req.logout();
    req.session.user = null;
    res.redirect('/');
});
/*
test case: if a user has the roles user, which is assigned when creating an account 
by default they cannot enter the route
it sends them a response saying they aren't an authed user
if the are then the code sends authe worked 
 */
router.get('/test', authRole('admin'), async (req, res) => {
    ProductQueries.getAll().then(results => {
        res.render('admin', { items: results, user: req.user || req.session.user })
    })
    console.log("auth worked");
})
router.get('/admin', authRole('admin'), async (req, res) => {
    ProductQueries.getAll().then(results => {
        res.render('admin', { items: results, user: req.user || req.session.user })
    })
    console.log("auth worked");
})
router.delete('/admin/remove-item', authRole('admin'), async (req, res) => {
    console.log(req.query.id)
    ProductQueries.deleteProduct(req.query.id).then(results => res.json({ result: results }))
})
router.post('/admin/add-item', authRole('admin'), async (req, res) => {
    // console.log(req.body.name)
    let j = req.body
    //{ name: '1', price: '2', type: 'T-shirts', desc: '3', image: '4' }
    new ProductSchema({
        productInfo: {
            title: j.name, price: j.price, description: j.desc
        },
        images: j.image,
        productType: j.type
    }).save();
    res.status(201).json({ message: 'Product added' })
})
// router.delete('/admin/remove-item-need-auth',authRole('admin'), async (req, res) => {
//     console.log(req.query.id)
//     // res.json({id: req.query.id})
// })

// OAuth2 routes
const passport = require('passport');

router.get('/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/login' }),
    (req, res) => {
        // Successful authentication, redirect.
        res.redirect('/');
    });

module.exports = router;