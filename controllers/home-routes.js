const router = require("express").Router();
const { blogPost, Comment, User } = require("../models");
const withAuth = require("../utils/auth");

// the home page
router.get("/", async (req, res) => {
  try {
    // finds all the blogPosts
    const dbBlogPostData = await blogPost.findAll({
      include: [
        {
          // includes the username, will let me display the username on the blog post
          model: User,
          attributes: { exclude: ["password"] },
        },
      ],
      order: [["id", "DESC"]],
    });
   // this will serialize the data and enriches the object with a boolean to see if the logged in user made the comment
    //   this new part of the object is used for the handlebars if statment

      const allPosts = dbBlogPostData.map((allPost) => {
      post = allPost.get({ plain: true });
      post.ownedByCurrentUser = post.userId === req.session.user_id;
      return post;
    });
    // console.log(allPosts);
    // console.log("req.session.user_id is: ", req.session.user_id);

    // const sameUser = allPosts.map((post) => {
    //     post.ownedByCurrentUser = (post.userId === req.session.user_id)
    //     return post;
    // });

    // console.log(allPosts.user_id)
    // console.log(sameUser);
    res.render("home", {
      // the data that's sent/will be usable in 'home.handlebars'
      allPosts,
      logged_in: req.session.logged_in,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json(error);
  }
});
router.get("/dashboard", async (req, res) => {
  try {
    // finds all the blogPosts
    const dbBlogPostData = await blogPost.findAll({
      include: [
        {
          // includes the username, will let me display the username on the blog post
          model: User,
          attributes: { exclude: ["password"] },
        },
      ],
      order: [["id", "DESC"]],
    });
   // this will serialize the data and enriches the object with a boolean to see if the logged in user made the comment
    //   this new part of the object is used for the handlebars if statment

      const allPosts = dbBlogPostData.map((allPost) => {
      post = allPost.get({ plain: true });
      post.ownedByCurrentUser = post.userId === req.session.user_id;
      return post;
    });
    // console.log(allPosts);

    // console.log("req.session.user_id is: ", req.session.user_id);

    // const sameUser = allPosts.map((post) => {
    //     post.ownedByCurrentUser = (post.userId === req.session.user_id)
    //     return post;
    // });

    // console.log(allPosts.user_id)
    // console.log(sameUser);
    console.log('///////////////////////////////////////////');
    console.log('////////////////////////////////////////////////////////////////req.session.logged_in is: ', req.session.logged_in);
    if(req.session.logged_in){
        res.render("dashboard", {
        // the data that's sent/will be usable in 'home.handlebars'
        allPosts,
        logged_in: req.session.logged_in,
      });
    }
    else{
      res.render('home',{
        allPosts,
        logged_in: req.session.logged_in,
      })
    }
  } catch (error) {
    console.error(error);
    res.status(500).json(error);
  }
});
// This will be used when someone clicks on a specific blog post
// take a look at /partials/blogpost-details.handlebars for a little more how it works
// essentially, when you click on the 'comment' button, the href is '/blogpost/{{blogPost.id}}'
// then this .get() is reached
router.get("/blogpost/:id", async (req, res) => {
  try {
    // Find the blog post by its ID and include the associated user
    const dbBlogPostData = await blogPost.findByPk(req.params.id, {
      include: [
        {
          model: User,
          attributes: ["userName"],
        },
      ],
    });

    // Finds all comments related to the blog post
    const dbCommentData = await Comment.findAll({
      // Filter by the blog post ID (blogPost_id is a key in in the Comment model)
      where: { blogPost_id: req.params.id },
      include: [
        {
          model: User,
          attributes: {exclude: ["password"]},
        },
      ],
    });

    // this will serialize the data and enriches the object with a boolean to see if the logged in user made the comment
    //   this new part of the object is used for the handlebars if statment
    const selectComments = dbCommentData.map((comment) =>{
      comment = comment.get({ plain: true });
      comment.ownedByCurrentUser = comment.user_id === req.session.user_id;
      return comment;
    });
    
    // serialize the blog post. only 1 blog post so it doesn't need a .map()
    const selectBlog = dbBlogPostData.get({ plain: true });

    // Render the view with the blog post and associated comments
    // console.log('select comments: ',selectComments);
    // console.log('req.session.user_id: ',req.session.user_id);
    res.render("comment", {
      ...selectBlog,
      // sends the comment data to comment.handlebars
    //   comments: selectComments,
      selectComments,
      logged_in: req.session.logged_in,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json(error);
  }
});

// path for an update
router.get("/blogUpdate/:id", async (req, res) => {
  try {
    const dbBlogPostData = await blogPost.findByPk(req.params.id);
    const selectPost = dbBlogPostData.get({ plain: true });

    res.render("updateBlog", {
      selectPost,
      logged_in: req.session.logged_in,
    });
  } catch (error) {
    res.status(500).json(error);
  }
});

router.get("/commentUpdate/:id", async (req, res) => {
  try {
    const dbCommentData = await Comment.findByPk(req.params.id);
    const selectComment = dbCommentData.get({ plain: true });
    res.render("updateComment", {
      selectComment,
      logged_in: req.session.logged_in,
    });
    // res.status(200).json(selectComment);
  } catch (error) {
    res.status(500).json(error);
  }
});

// the route for the profile/where a user can make a new blog post
// withAuth is a function in the utils folder
// Essentially checks if the session is NOT logged_in
// if thats true, they're redirected to '/login' and the rest of the .get() isn't executed
router.get("/profile", withAuth, async (req, res) => {
  try {
    // uses the session to get the user_id
    // (the session object is created in the server.js)
    // took me a bit to get how this is working but open the Session table in mysql
    // and log in with different accounts. It'll make more sense seeing
    // what the table looks like
    // console.log(`the session.user_id: ${req.session.user_id}`);

    const userData = await User.findByPk(req.session.user_id, {
      // doesn't get the password key
      attributes: { exclude: ["password"] },
    });
    const user = userData.get({ plain: true });

    // sends the data to profile and ensures logged_in is true

    // un-related but I think my if statement in blogpost-details.handlebars isn't
    // working because i'm not sending logged_in: true. I'll need to take a look
    // at this
    res.render("profile", {
      ...user,
      logged_in: true,
    });
  } catch (err) {
    res.status(500).json(err);
  }
});

// when they click login or go to the /login end point
// seends them to /profile if they're logged in
// or sends them to the login page
router.get("/login", (req, res) => {
  try {
    if (req.session.logged_in) {
      res.redirect("/profile");
      return;
    }

    res.render("login");
  } catch (error) {
    res.status(500).json(error);
  }
});

// seendds them to the createAccount page
// the logic for how this is done is all in public/js/signUp.js
router.get("/createAccount", (req, res) => {
  try {
    res.render("createAccount");
  } catch (error) {
    res.status(500).json(error);
  }
});

module.exports = router;
