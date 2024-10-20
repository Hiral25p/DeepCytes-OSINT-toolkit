# necessary libraries
from flask import Flask, request, jsonify
from flask_cors import CORS
import phonenumbers
from phonenumbers import geocoder, carrier, timezone
import requests
import instaloader
import tweepy
from dotenv import load_dotenv
import os
from itertools import cycle

load_dotenv()

# initialize Flask app
app = Flask(__name__)
CORS(app)

# api keys loop using cycle
numverify_keys = cycle([os.getenv('NUMVERIFY_API_KEY1'),
                        os.getenv('NUMVERIFY_API_KEY2'),
                        os.getenv('NUMVERIFY_API_KEY3'),
                        os.getenv('NUMVERIFY_API_KEY4'),
                        os.getenv('NUMVERIFY_API_KEY5')])

twilio_account_sid_keys = cycle([os.getenv('TWILIO_ACCOUNT_SID1'),
                                 os.getenv('TWILIO_ACCOUNT_SID2')])
twilio_auth_token_keys = cycle([os.getenv('TWILIO_AUTH_TOKEN1'),
                                os.getenv('TWILIO_AUTH_TOKEN2')])

ipqualityscore_keys = cycle([os.getenv('IPQUALITYSCORE_API_KEY1'),
                             os.getenv('IPQUALITYSCORE_API_KEY2'),
                             os.getenv('IPQUALITYSCORE_API_KEY3'),
                             os.getenv('IPQUALITYSCORE_API_KEY4'),
                             os.getenv('IPQUALITYSCORE_API_KEY5')])

def get_basic_phone_info(phonenumber):
    try:
        number = phonenumbers.parse(phonenumber)
        country = geocoder.description_for_number(number, 'en')
        service_provider = carrier.name_for_number(number, 'en')
        timezones = timezone.time_zones_for_number(number)
        return {
            "Country": country,
            "Service Provider": service_provider,
            "Timezones": ", ".join(timezones)
        }
    except phonenumbers.phonenumberutil.NumberParseException:
        return {"Error": "Invalid phone number."}

def get_numverify_info(phonenumber):
    api_key = next(numverify_keys)
    url = f"http://apilayer.net/api/validate?access_key={api_key}&number={phonenumber}"
    response = requests.get(url)
    return response.json() if response.status_code == 200 else {"Error": "Failed to fetch NumVerify info."}

def get_twilio_info(phonenumber):
    account_sid = next(twilio_account_sid_keys)
    auth_token = next(twilio_auth_token_keys)
    lookup_url = f"https://lookups.twilio.com/v1/PhoneNumbers/{phonenumber}"
    response = requests.get(lookup_url, auth=(account_sid, auth_token))
    return response.json() if response.status_code == 200 else {"Error": "Failed to fetch Twilio info."}

def get_ipqualityscore_info(phonenumber):
    api_key = next(ipqualityscore_keys)
    url = f"https://ipqualityscore.com/api/json/phone/{api_key}/{phonenumber}"
    response = requests.get(url)
    return response.json() if response.status_code == 200 else {"Error": "Failed to fetch IPQualityScore info."}

def extract_info(response):
    relevant_info = {}
    other_info = {}

    if response:
        if "phone_number" in response:
            relevant_info["Phone Number"] = response.get("phone_number")
        if "valid" in response:
            relevant_info["Validity"] = "Yes" if response.get("valid") else "No"
        if "country_code" in response:
            relevant_info["Country Code"] = response.get("country_code")
        if "location" in response:
            relevant_info["Location"] = response.get("location")
        if "carrier" in response:
            relevant_info["Carrier"] = response.get("carrier")
        if "line_type" in response:
            relevant_info["Line Type"] = response.get("line_type")
        if "fraud_score" in response:
            relevant_info["Fraud Score"] = response.get("fraud_score")
        if "recent_abuse" in response:
            relevant_info["Recent Abuse"] = response.get("recent_abuse")

        other_info = {key: value for key, value in response.items() if key not in relevant_info}

    return relevant_info, other_info

def get_instagram_info(username):
    x = instaloader.Instaloader()
    try:
        profile = instaloader.Profile.from_username(x.context, username)
        return {
            "Username": profile.username,
            "ID": profile.userid,
            "Full Name": profile.full_name,
            "Biography": profile.biography,
            "Business Category": profile.business_category_name,
            "External URL": profile.external_url,
            "Followers": profile.followers,
            "Following": profile.followees,
            "Media Count": profile.mediacount,
            "Is Private": profile.is_private,
            "Is Verified": profile.is_verified,
            "Profile Picture URL": profile.profile_pic_url
        }
    except instaloader.exceptions.InstaloaderException as e:
        return {"Error": str(e)}

def get_twitter_info(username):
    bearer_token = os.getenv('TWITTER_BEARER_TOKEN1')
    
    if not bearer_token:
        return {"Error": "Bearer token not found in environment variables."}
    
    client = tweepy.Client(bearer_token=bearer_token)
    
    try:
        user = client.get_user(username=username, user_fields=["id", "name", "username", "location", "description", "public_metrics", "verified", "created_at"])
        
        if user.data:
            user_data = user.data
            return {
                "Name": user_data['name'],
                "Username": user_data['username'],
                "User ID": user_data['id'],
                "Description": user_data['description'],
                "Location": user_data['location'],
                "Followers Count": user_data['public_metrics']['followers_count'],
                "Following Count": user_data['public_metrics']['following_count'],
                "Tweet Count": user_data['public_metrics']['tweet_count'],
                "Account Created At": user_data['created_at'],
                "Verified": user_data['verified']
            }
        else:
            return {"Error": "User not found on Twitter."}
    
    except tweepy.TweepyException as e:
        return {"Error": str(e)}

def get_github_info(username):
    url = f"https://api.github.com/users/{username}"
    try:
        response = requests.get(url)
        if response.status_code == 200:
            user_data = response.json()
            return {
                "Username": user_data['login'],
                "ID": user_data['id'],
                "Full Name": user_data.get('name', 'N/A'),
                "Bio": user_data.get('bio', 'N/A'),
                "Public Repos": user_data['public_repos'],
                "Followers": user_data['followers'],
                "Following": user_data['following'],
                "Profile Created At": user_data['created_at'],
                "Profile URL": user_data['html_url']
            }
        else:
            return {"Error": f"User {username} not found on GitHub."}
    except requests.exceptions.RequestException as e:
        return {"Error": str(e)}

def phone_number_osint(phonenumber):
    combined_relevant_info = {}
    combined_other_info = {}

    basic_info = get_basic_phone_info(phonenumber)
    combined_relevant_info.update(basic_info)

    numverify_info = get_numverify_info(phonenumber)
    if numverify_info:
        relevant, other = extract_info(numverify_info)
        combined_relevant_info.update(relevant)
        combined_other_info.update(other)

    twilio_info = get_twilio_info(phonenumber)
    if twilio_info:
        relevant, other = extract_info(twilio_info)
        combined_relevant_info.update(relevant)
        combined_other_info.update(other)

    

    ipqualityscore_info = get_ipqualityscore_info(phonenumber)
    if ipqualityscore_info:
        relevant, other = extract_info(ipqualityscore_info)
        combined_relevant_info.update(relevant)
        combined_other_info.update(other)

    return combined_relevant_info, combined_other_info

def get_hunter_info(email):
    api_key = os.getenv('HUNTER_API_KEY')
    url = f"https://api.hunter.io/v2/email-verifier?email={email}&api_key={api_key}"
    response = requests.get(url)
    return response.json() if response.status_code == 200 else {"Error": "Failed to fetch Hunter.io info."}

import re
import socket

def extract_email_info(email):
    email_info = {"Valid Format": bool(re.match(r"[^@]+@[^@]+\.[^@]+", email))}

    domain = email.split('@')[1]
    email_info['Domain'] = domain

    common_providers = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com']
    email_info['Common Provider'] = "Yes" if domain in common_providers else "No"

    try:
        mx_records = socket.gethostbyname_ex(domain)
        email_info['MX Records'] = mx_records[2]
    except socket.gaierror:
        email_info['MX Records'] = "Domain not found or no MX records available"

    return email_info

@app.route('/process', methods=['POST'])
def process_input():
    data = request.json
    print('Received data:', data)

    phone_number = data.get('phoneNumber')
    instagram = data.get('instagram')
    twitter = data.get('twitter')
    github = data.get('github')
    email = data.get('email')  

    relevant_info = {}
    other_info = {}

    if phone_number:
        phone_relevant, phone_other = phone_number_osint(phone_number)
        relevant_info.update(phone_relevant)
        other_info.update(phone_other)

    if instagram:
        relevant_info['Instagram Info'] = get_instagram_info(instagram)

    if twitter:
        relevant_info['Twitter Info'] = get_twitter_info(twitter)

    if github:
        relevant_info['GitHub Info'] = get_github_info(github)

    if email:  
        relevant_info['Email Info'] = extract_email_info(email)
        relevant_info['Hunter.io Info'] = get_hunter_info(email)

    output = {
        "relevant_info": relevant_info,
        "other_info": other_info
    }

    return jsonify(output)

# start Flask app
if __name__ == '__main__':
    app.run(debug=True)


