The purpose of this tutorial is to show how a developer can make a app for the Settle platform that utilizes both the portfolio and price feed API's.  The app will calculate the common Value At Risk (VAR) and a few other common portfolio analytics

### Read the full docs here: 
https://docs.settle.finance/display/SP/Risk+Check+Tutorial


### Get a set of API key & secret for your app
Go to https://settle.finance/ click on "Developer Tools" then the "Apps" tab and finally click the "Create an App" button.  This will give you and api key & secret for your app to use.  Paste them into the .env file in the repo.

go to the ui-1 folder /Portfolio-Example/ui-1>

### Install dependencies
```
npm install
```

### Run the server locally
```
npm run local
```

This will run the server and open a browser window for the gui (which will not work).  In order to see the gui you have to run it inside of the Settle developer sandbox.  This will handle correctly passing the user id token to your app (more about user id tokens below).

Go to https://settle.finance/ then paste this link http://localhost:3000 and hit enter.  

