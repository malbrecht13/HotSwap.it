const { User } = require('../models/user');
const { UserStore } = require('../models/userStore');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// register a new user
const register = async (req, res) => {
    try {
        const passHash = bcrypt.hashSync(req.body.password, 10); //encrypt the password
        let userStore = new UserStore();
        userStore = await userStore.save();
        let user = new User({
            username: req.body.username,
            passwordHash: passHash,
            email: req.body.email,
            shippingAddressLine1: req.body.shippingAddressLine1,
            shippingAddressLine2: req.body.shippingAddressLine2,
            city: req.body.city,
            state: req.body.state,
            zip: req.body.zip,
            store: userStore,
            notifications: [],
            messages: [],
        });

        user = await user.save();
        if (!user) {
            return res
                .status(400)
                .send({
                    success: false,
                    message: 'The user cannot be created',
                });
        }
        // update UserStore to contain this User
        userStore = await UserStore.findByIdAndUpdate(userStore.id, {
            user: user.id,
        });
        if (!userStore) {
            return res
                .status(400)
                .send({ message: 'UserStore could not update user' });
        }
        return res.status(200).send({success: true, message: 'User successfully registered'});
    } catch (e) {
        return res
            .status(500)
            .send({ success: false, message: 'Error registering user' });
    }
};

const login = async (req, res) => {
    try {
        const user = await User.findOne({
            username: req.body.username,
        });
        const secret = process.env.SECRET;
        if (!user) {
            return res.status(400).send({ message: 'The user was not found' });
        }
        if (user && bcrypt.compareSync(req.body.password, user.passwordHash)) {
            const token = jwt.sign(
                {
                    userId: user.id,
                },
                secret,
                { expiresIn: '1d' }
            );
            res.status(200).send({ user: user.username, userId: user.id, token: token });
        } else {
            res.status(400).send({
                message: 'The username or password was not correct',
            });
        }
        return res.status(200).send(user);
    } catch (e) {
        res.status(500).send({ message: 'Server error' });
    }
};

// const getCurrentUser = async (req,res) => {
//   try {
//     const user = await User.findById(req.params.id).select('-passWordHash');
//     if(!user) {
//       res.status(404).json({message: 'User not found.'})
//     }
//     res.status(200).send(user);
//   } catch(e) {
//     res.status(500).json({message: 'Error getting current user'});
//   }
// }

const updateUsername = async (req, res) => {
    try {
        const id = req.params.id;
        const userExists = await User.findById(id);
        if (!userExists) {
            return res.status(404).send({ message: 'User not found' });
        }
        const user = await User.findByIdAndUpdate(
            req.params.id,
            {
                username: req.body.username,
            },
            { new: true }
        );

        if (!user) {
            return res
                .status(400)
                .send({ message: 'The username could not be updated' });
        }
        return res.status(200).send({success: true, message: `Username successfully changed to ${user.username}`});
    } catch (e) {
        res.status(500).send({
            success: false,
            message: 'Server error while attempting to update username',
        });
    }
};

const updatePassword = async (req, res) => {
    try {
        const id = req.params.id;
        const userExists = await User.findById(id);
        if (!userExists) {
            return res.status(404).send({ message: 'User not found' });
        }
        const password = bcrypt.hashSync(req.body.password, 10);
        const user = await User.findByIdAndUpdate(
            req.params.id,
            {
                passwordHash: password,
            },
            { new: true }
        );

        if (!user) {
            return res
                .status(400)
                .send({ message: 'The password could not be updated' });
        }
        return res.status(200).send({success: true, message: 'Successfully updated password'});
    } catch (e) {
        res.status(500).send({
            success: false,
            message: 'Server error while attempting to update password',
        });
    }
};

const updateAddress = async (req, res) => {
    try {
        const id = req.params.id;
        const userExists = await User.findById(id);
        if (!userExists) {
            return res.status(404).send({ message: 'User not found' });
        }
        let user = await User.findByIdAndUpdate(
            req.params.id,
            {
                email: req.body.email,
                shippingAddressLine1: req.body.shippingAddressLine1,
                shippingAddressLine2: req.body.shippingAddressLine2,
                city: req.body.city,
                state: req.body.state,
                zip: req.body.zip,
            },
            { new: true }
        );

        if (!user) {
            return res
                .status(400)
                .send({ message: 'The address could not be updated' });
        }
        const newUserAddress = {
          email: user.email,
          shippingAddressLine1: user.shippingAddressLine1,
          shippingAddressLine2: user.shippingAddressLine2,
          city: user.city,
          state: user.state,
          zip: user.zip
        }
        return res.status(200).send(newUserAddress);
    } catch (e) {
        res.status(500).send({
            success: false,
            message: 'Server error while attempting to update address',
        });
    }
};

module.exports = {
    updateUsername,
    updatePassword,
    updateAddress,
    login,
    register,
};
