function validate(data) {
    /*
     I can get the client input here, but no client input should be trusted before validation

     this function can go through data to make sure they meet the requirement, or throw out error

     for example, for query     

     account.name.length === 10
     isEmail(client.email) should be true

     if not met, I can throw out specific error so the server can response to this invalid request
     return new Error('account number must be 10 digits long');

     there can be multiple validation function for different data
     for simple, I only add this function signature and suppose data is valid, and return


     */
    return data;
}

module.exports = {validate};
