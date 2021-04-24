const localStrategy = require("passport-local").Strategy;

const bcrypt = require("bcrypt");

function initialize(passport, getUserByName, getUserById) {
  const authenticateUser = async (name, password, done) => {
    const user = getUserByName(name);
    if (user == null) {
      return done(null, false, { message: "no user with that name" });
      console.log(message);
    }
    try {
      if (await bcrypt.compare(password, user.password)) {
        return done(null, user);
      } else {
        return done(null, false, { message: "password incorrect" });
      }
    } catch (e) {
      return done(e);
    }
  };
  passport.use(new localStrategy({ usernameField: "name" }, authenticateUser));
  passport.serializeUser((user, done) => {
    done(null, user.password);
  });
  passport.deserializeUser((password, done) => {
    return done(null, getUserById(password));
  });
}

module.exports = initialize;

// const LocalStrategy = require('passport-local').Strategy
// const bcrypt = require('bcrypt')

// function initialize(passport, getUserByName, getUserById) {
//     const authenticateUser = async (Name, password, done) => {
//         const user = getUserByName(Name)
//         if (user == null) {
//             return done(null, false, { message: 'No user with that Name' })
//         }

//         try {
//             if (await bcrypt.compare(password, user.password)) {
//                 return done(null, user)
//             } else {
//                 return done(null, false, { message: 'Password incorrect' })
//             }
//         } catch (e) {
//             return done(e)
//         }
//     }

//     passport.use(new LocalStrategy({ usernameField: 'Name' }, authenticateUser))
//     passport.serializeUser((user, done) => done(null, user.id))
//     passport.deserializeUser((id, done) => {
//         return done(null, getUserById(id))
//     })
// }

// module.exports = initialize
