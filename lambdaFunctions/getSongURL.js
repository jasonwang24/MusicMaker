//Using Node.js 12.x

'use strict';
const AWS = require('aws-sdk');

const documentClient = new AWS.DynamoDB.DocumentClient();

let responseBody = "";
let statusCode = 0;

exports.handler = async (event) => {
  return getItem(event);
};

const getItem = async event => {

  var eventBody = JSON.parse(event.body);

  const params = {
    TableName: "share_songs",
    Key: {
      song_id: eventBody.song_id
    },
    ProjectionExpression: "song_string"
  }
  try {
    const data = await documentClient.get(params).promise();
    responseBody = JSON.stringify(data["Item"]["song_string"]).replace(/\"/g, "");
    statusCode = 201;
  } catch (err) {
    responseBody = `Unable to put song url: ${err}`;
    statusCode = 403;
  }
  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "access-control-allow-origin": "*"
    },
    body: JSON.stringify({
      message: responseBody
    })
  }
}