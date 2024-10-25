const jwt = require('jsonwebtoken');


const secretKey = "key";
const createToken = (username, password) => {

    // Check if the user exists
    // dont do this yet, we dont have database at moment
    // user = find user in database
    // if !user then return 401

    // Check if the password is correct
    // if user.password !== password then return 401

    // Create a token
    const token = jwt.sign({userId: `${username}-${password}`}, secretKey, {
        expiresIn: '1h'
    });

    if (Storage !== undefined) {
        localStorage.setItem('token', token);
    } else {
        console.log('Local storage is not supported');
    }
}

const authenicate = () => {
    const token = localStorage.getItem('token');
    if (token) {
        const decoded = jwt.verify(token, secretKey);
        localStorage.setItem('id', decoded);
        return true;
    }
    else
    {
        return false;
    }
}