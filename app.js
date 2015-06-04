  var express = require('express'),
      passport = require('passport'),
      _ = require('underscore'),
      request = require('request'),
      https = require('https'),
      qs = require('querystring'),
      session = require('express-session'),
      util = require('util'),
      bodyParser = require('body-parser'),
      cookieParser = require('cookie-parser'),
      methodOverride = require('method-override'),
      GitHubStrategy = require('passport-github2').Strategy;

  var GITHUB_CLIENT_ID = "1e18bf0d07ce22f3461a"
  var GITHUB_CLIENT_SECRET = "ff7fb359be783eca54aba648e9ece962bb893a88";

  var mytoken;
  // Passport session setup.
  //   To support persistent login sessions, Passport needs to be able to
  //   serialize users into and deserialize users out of the session.  Typically,
  //   this will be as simple as storing the user ID when serializing, and finding
  //   the user by ID when deserializing.  However, since this example does not
  //   have a database of user records, the complete GitHub profile is serialized
  //   and deserialized.
  passport.serializeUser(function(user, done) {
      done(null, user);
  });

  passport.deserializeUser(function(obj, done) {
      done(null, obj);
  });


  // Use the GitHubStrategy within Passport.
  //   Strategies in Passport require a `verify` function, which accept
  //   credentials (in this case, an accessToken, refreshToken, and GitHub
  //   profile), and invoke a callback with a user object.
  passport.use(new GitHubStrategy({
          clientID: GITHUB_CLIENT_ID,
          clientSecret: GITHUB_CLIENT_SECRET,
          callbackURL: "https://127.0.0.1:3000/auth/github/callback"
      },
      function(accessToken, refreshToken, profile, done) {
          // asynchronous verification, for effect...
          process.nextTick(function() {

              // To keep the example simple, the user's GitHub profile is returned to
              // represent the logged-in user.  In a typical application, you would want
              // to associate the GitHub account with a user record in your database,
              // and return that user instead.
              return done(null, profile);
          });
      }
  ));




  var app = express();

  // configure Express
  //app.configure(function() {
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  // app.use(logger());
  //app.use(express.cookieParser());
  app.use(cookieParser());
  app.use(bodyParser.urlencoded({
      'extended': 'true'
  }));
  app.use(bodyParser.json());
  app.use(bodyParser.json({
      type: 'application/vnd.api+json'
  }));
  app.use(methodOverride('X-HTTP-Method-Override'));
  //app.use(express.methodOverride());
  //app.use(session({ secret: 'keyboard cat' }));
  // Initialize Passport!  Also use passport.session() middleware, to support
  // persistent login sessions (recommended).

  //app.use(app.router);
  app.use(express.static(__dirname + '/public'));
  //});


  app.get('/', function(req, res) {
      //console.log('1111111111111111111');
      res.render('index', {
          user: GITHUB_CLIENT_ID
      });
  });

  var access_token, _options;
  app.get('/login', function(req, res) {
      // console.log('111111111111133333333333333333333333333333333333111111');

      res.render('login', {
          clientid: GITHUB_CLIENT_ID
      });

  });

  app.get('/authorized', function(req, res) {

      //console.log('lllllllllllllllllllllll');
      //console.log(req.query.code);
      /////////////////////////////////////////////////////////////////////////////////////////////////////////////
      mycode = req.query.code;
      //res.render('authorized');
      var formData = "code=" + mycode +
          "&client_id=" + GITHUB_CLIENT_ID +
          "&client_secret=" + GITHUB_CLIENT_SECRET +
          "&redirect_uri=" + 'http://127.0.0.1:3000/authorized';

      var options = {
          url: "https://github.com/login/oauth/access_token",
          headers: {
              'content-type': 'application/x-www-form-urlencoded'
          },
          method: "POST",
          body: formData
      };

      request(options, function(err, res, body) {

          var mylist = qs.parse(body);
          mytoken = mylist.access_token;
          // console.log(mylist.access_token);
          //console.log("got the token==================", mytoken);
          app.set('USER', 'ankunath');
          //console.log(mytoken);
          app.set('GITHUB_AUTH_TOKEN', mytoken);
          //var temp=app.get('USER');
          //console.log(temp);

          _options = {
              headers: {
                  'User-Agent': app.get('USER'),
                  'Authorization': 'token ' + app.get('GITHUB_AUTH_TOKEN')
              },
              hostname: 'api.github.com'
          };
          // console.log(_options.headers);

          //fetchRepos(fetchPullRequests);
          fetchUser(fetchCommitRequests);
      });
      //res.render('authorized');
      /////////////////////////////////////////////////////////////////////////////////////////////////////////////
      //var USER ='ankunath';
      //var GITHUB_AUTH_TOKEN=req.query.code;

      //console.log('after fetch fetch repos=============\n');

      app.once('pullingRequests:fetched', function(pullRequests) {
          //  response.writeHead(200, {'Content-Type': 'text/JSON'});
          /*var html = "";
    //console.log(pullRequests,'\n');
    _.each(pullRequests, function (pullRequests, index) {
     //html += 'There is <strong>'+ pullRequests.data.length +'</strong> pending pull request(s) for <strong>';

      //html += '<ul>';
      _.each(pullRequests.data, function (pullRequest) {

        html +=  pullRequest.commit.committer.name ;
      });
      //html += '</ul>';
    });
*/
          //var xyz=json(html);
          //var xyz=JSON.parse(html);

          res.send(pullRequests);

          res.end();
      });



      function fetchUser(callback) {
          //console.log(USER);
          _options.path = '/users/' + app.get('USER') + '/repos';
          //console.log('in fetch repos=============================');
          // Fetch the list of repos for a given organisation
          //console.log(_options.path);
          var requests = https.get(_options, function(res) {
              data = "";
              //console.log('==================================================');

              res.on('data', function(chunk) {
                  //  console.log(chunk);
                  data += chunk;

              });

              res.on('end', function() {
                  // console.log(data);
                  var repos = JSON.parse(data);
                  //console.log(repos);

                  return callback(repos);
              });
          });

          requests.on('error', function(error) {
              console.log('Problem with request: ' + error);
          });
      }

      function fetchCommitRequests(repos) {
          var pullRequests = [];           //its my array
          // console.log('in fech pullrequest=============================');

          _.each(repos, function(repo, index) {
              //console.log('====================',repo,'\n');

              _options.path = '/repos/' + app.get('USER') + '/' + repo.name + '/commits';
              var requests = https.get(_options, function(res) {
                      var data = "";
                      console.log(res);

                      res.on('data', function(chunk) {
                          data += chunk;
                          // console.log(data.url,'\n');

                      });

                      res.on('end', function() {
                          data = JSON.parse(data);
                          if (data.length > 0) {
                              pullRequests.push({
                                  repo: repo.name,
                                  data: data
                              });
                          }

                          if (index == (repos.length - 1)) {
                              app.emit('pullingRequests:fetched', pullRequests);
                          }
                      });
              });
              //console.log(request);
          });
      }

      //////////////////////////////////////////////////////////////////////////////////////////////////////////////
  });


  // GET /auth/github
  //   Use passport.authenticate() as route middleware to authenticate the
  //   request.  The first step in GitHub authentication will involve redirecting
  //   the user to github.com.  After authorization, GitHubwill redirect the user
  //   back to this application at /auth/github/callback

  app.listen(3000);


  // Simple route middleware to ensure user is authenticated.
  //   Use this route middleware on any resource that needs to be protected.  If
  //   the request is authenticated (typically via a persistent login session),
  //   the request will proceed.  Otherwise, the user will be redirected to the
  //   login page.
  function ensureAuthenticated(req, res, next) {
      if (req.isAuthenticated()) {
          return next();
      }
      res.redirect('/login')
  }
