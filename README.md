# Frontend Engineer Homework

## Overview 

Implement a "Queued Chat" web application that allows visitors to queue up for chatting with an operator.
This application will be composed of a small webserver component with two endpoints.

## Root endpoint /

The `/` endpoint is where visitors enter the queue. This page should have the following:
* A place to enter the nickname of the visitor
* An indicator that shows if the operator is currently available to chat
** What is the visitor's place in the queue to chat with the operator
** If currently chatting with the operator, it should have an interface suitable for chatting. At a minimum:
** A text input for entering data
** A history of the current chatting session, with messages from both operator and current visitor
** Under no circumstances a visitor should have visibility to the global queue of visitors or chat with other visitors.

## Operator Endpoint /operator

The `/operator` endpoint is where the operator enters the site and makes himself/herself available to chat. The requirements for this page are:
* It should have a list with the queue of current visitors waiting to chat
* A chat session history with the current chatting visitor.
* You can assume that only a single operator can be logged in at all times.

## Other considerations

* The operator can only chat with one visitor at a time.
* The operator can end the current chatting session by sending !next as a message. The next visitor in the queue will be served.
* You can use a javascript framework of your choice for the frontend. 
* Make sure that you exercise stylesheets in your solution.
* Feel free to use the starter code in this repo as a base.
* If you are unclear about specifications in here, feel free to make assumptions but document them under an ASSUMPTIONS.md file.

## Nice to have 
* Write unit tests.

