const express = require('express');
const mongoose = require('mongoose')
var bodyParser = require('body-parser')
var session = require('express-session')
const fileUpload = require('express-fileupload');
const fs = require('fs')
require('dotenv').config()

const path = require('path');

const app = express();

const Posts = require('./Posts');

var users = [
    {
        login: process.env.LOGIN,
        password: process.env.PASSWORD
    }
]


mongoose.connect(process.env.DB_CONNECTION, { useNewUrlParser: true, useUnifiedTopology: true }).then(() => {
    console.log('Conectado!')
}).catch((err) => console.log(err.message))


app.use(bodyParser.json());       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
    extended: true
}));
app.use(session({
    secret: 'jsakfaoshfo1oiofiabsoi',
    cookie: { maxAge: 60000 }
}))
app.use(fileUpload({
    useTempFiles: true,
    tempFileDir: path.join(__dirname, 'temp')
}))

app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');
app.use('/public', express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, '/pages'));


app.get('/', (req, res) => {

    if (req.query.search == null) {
        Posts.find({}).sort({ '_id': -1 }).exec((err, posts) => {
            posts = posts.map((val) => {
                return {
                    title: val.title,
                    content: val.content,
                    description: val.content.substring(0, 100),
                    image: val.image,
                    slug: val.slug,
                    category: val.category
                }
            })

            Posts.find({}).sort({ 'views': -1 }).limit(3).exec(function (err, postsTop) {
                postsTop = postsTop.map(function (val) {
                    return {
                        title: val.title,
                        content: val.content,
                        description: val.content.substring(0, 100),
                        image: val.image,
                        slug: val.slug,
                        category: val.category,
                        views: val.views
                    }
                })
                res.render('home', { posts: posts, postsTop: postsTop });
            })
        })
    } else {
        Posts.find({ title: { $regex: req.query.search, $options: "i" } }, (err, posts) => {
            posts = posts.map(function (val) {
                return {
                    title: val.title,
                    content: val.content,
                    description: val.content.substring(0, 100),
                    image: val.image,
                    slug: val.slug,
                    category: val.category,
                    views: val.views
                }
            })
            res.render('search', { posts: posts, count: posts.length })
        })
    }

});


app.get('/:slug', (req, res) => {
    Posts.findOneAndUpdate({ slug: req.params.slug }, { $inc: { views: 1 } }, { new: true }, (err, response) => {
        if (response != null) {
            Posts.find({}).sort({ 'views': -1 }).limit(3).exec(function (err, postsTop) {
                postsTop = postsTop.map(function (val) {
                    return {
                        title: val.title,
                        content: val.content,
                        description: val.content.substring(0, 100),
                        image: val.image,
                        slug: val.slug,
                        category: val.category,
                        views: val.views
                    }
                })
                res.render('single', { news: response, postsTop: postsTop })
            })
        } else {
            res.redirect('/')
        }
    })
})

app.get('/admin/delete/:id', (req, res) => {
    Posts.deleteOne({ _id: req.params.id }).then(() => {
        res.redirect('/admin/login')
    })
})

app.get('/admin/login', (req, res) => {
    if (req.session.login == null) {
        res.render('adm-login')
    } else {
        Posts.find({}).sort({ '_id': -1 }).exec((err, posts) => {
            posts = posts.map((val) => {
                return {
                    id: val._id,
                    title: val.title,
                    content: val.content,
                    description: val.content.substring(0, 100),
                    image: val.image,
                    slug: val.slug,
                    category: val.category
                }
            })
            res.render('dashboard', { posts: posts })
        })
    }
})

app.post('/admin/register-news', (req, res) => {
    let format = req.files.file.name.split('.')
    var image = `${new Date().getTime()}.${format[format.length - 1] == 'jpg' ? 'jpg' : 'png'}`
    if (format[format.length - 1] == 'jpg' || format[format.length - 1] == 'png') {
        req.files.file.mv(`${__dirname}/public/images/${image}`)
    } else {
        fs.unlinkSync(req.files.file.tempFilePath)
    }



    Posts.create({
        title: req.body.news_title,
        image: `http://localhost:5000/public/images/${image}`,
        category: "Sem",
        slug: req.body.slug,
        content: req.body.news_content,
        description: req.body.news_content.substring(0, 100),
        author: "Pedro Henrique",
        views: 0
    })
    res.redirect('/admin/login')
})

app.post('/admin/login', (req, res) => {
    users.map((val) => {
        if (val.login === req.body.login && val.password === req.body.password) {
            req.session.login = 'Pedro'
        }
    })
    res.redirect('/admin/login')
})

app.listen(5000, () => {
    console.log('server rodando!');
})