# DC Toolkit 
To use the DeepCytes OSINT Search Engine, follow the below steps.

## Clone the repository 
In your terminal run:    
`git clone https://github.com/Hiral25p/DeepCytes-OSINT-toolkit.git`

### Navigate to the project folder:
`cd DeepCytes-OSINT-toolkit`



## Frontend Setup

1. Open a new terminal for the frontend.
2. Navigate to the `frontend` folder:  
   `cd toolkit`    

To install all the Libraries for Frontend:    
`npm install react react-dom`   
`npm install vite`   

To run the frontend application, use the following command in the frontend terminal:   
`npm run dev`    





## Backend Setup
1. Open a separate terminal for the backend.
2. Navigate to the `backend` folder:
`cd backend`   

To install all the Libraries for Backend:    
`pip install -r requirements.txt`


### API Configuration
In the backend root folder, create a .env file with the following format:
### Phone Number    
`NUMVERIFY_API_KEY=your_numverify_api_key`  
`TWILIO_ACCOUNT_SID=your_twilio_account_sid`   
`TWILIO_AUTH_TOKEN=your_twilio_auth_token`   
`NUMLOOKUPAPI_KEY=your_numlookupapi_key`      
`IPQUALITYSCORE_API_KEY=your_ipqualityscore_api_key`     

### Social Media  
`TWITTER_BEARER_TOKEN=your_twitter_bearer_token`   

### Email     
`HUNTER_API_KEY=your_hunter_api_key`    

Make sure to generate and paste your respective API keys in the .env file.   

To run the backend application, use the following command in the backend terminal:   
`python app.py`      






## Note      
Both, the frontend and backend need to be running simultaneously for the toolkit to work.
