# Bluemix and Watson feedback demo

This project uses IBM Bluemix and Watson services to demonstrate how to translate and anlayzie the tone of client submitted feedback.  

The client submits a feedback message using languages, English, Spanish, or French.  If the message was submitted in Spanish or French, Watson Language Translation is used to translate the message to English.  

Next, using Watson Tone Analyzer, the English messaage is processed to determine the tone of the feedback.  Five tone categories, joy, sadness, anger, disgust, and fear, are scored.  The higher a score the stronger that category is ranked.

Submitting feedback informaiton can be accomplished using many approaches.  A simple Ionic 2 / Angular 2 mobile app, Postman, or command line utility curl.


