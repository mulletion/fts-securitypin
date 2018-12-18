var AWS = require('aws-sdk');
var dynamodb = new AWS.DynamoDB({apiVersion: '2012-10-08'});
exports.handler = function (event,context,callback) {
    // console.log('Received event:',JSON.stringify(event, null, 2));
    const eventObj= event.Records[0];
    const bucketName = eventObj.s3.bucket.name;
    let fullPath = eventObj.s3.object.key;
   
    let fileName = "";
    let fileType = fullPath.substring(0,2);
    let sysdateTime = new Date().toLocaleString('en-US', { timeZone: 'Asia/Bangkok' });
    var datesSplit = sysdateTime.split('/').map(function (val) {
        return String(val);
    });
    var yearMonth = datesSplit[2].split(',')[0]+"-"+datesSplit[0];
    console.log(yearMonth);
    let tableName = "fts-securitypin-activitysecuritypinandefiletable-"+yearMonth+"-dev-aws-dynamodbtable";
    
    let initialStatus = "Push and Wait For Download";
    let typeFile  ;
    if(fileType === "Se"){
        //SecurityPIN Case
        console.log("Security PIN Case");
        fileName = fullPath.substring(20,fullPath.length);
        typeFile = "SecurityPIN";
    }else if(fileType==="EF"){
        //EFile Case
        console.log("EFile Case");
        fileName = fullPath.substring(14,fullPath.length);
        typeFile = "EFile";
    }
    
    let storeId = fileName.substring(4,9);
    // let strMonthDate = fileName.substring(0,4);
    // let invoiceNo = fileName.substring(9,19);
    // let warehouseId = fileName.substring(21,fileName.length);
    
    console.log("Bucket Name "+bucketName);
    console.log("FullPath Name "+fullPath);
    console.log("File Name "+fileName);
    console.log("storeId  "+storeId);
    // console.log("MonthDate "+strMonthDate);
    // console.log("invoiceNo "+ invoiceNo);
    // console.log("warehouseId " + warehouseId);
    console.log("Sysdate "+ sysdateTime);
    
    var paramsPutItem = {
        Item: {
            "DATE_TIME": { S: sysdateTime+":"+lpad(new Date().getMilliseconds(),3)}, 
            "STORE_ID": { S: storeId}, 
            "FILENAME":{S:fileName},
            "TYPE_FILE":{S:typeFile},
            "ACTIVITY_STATUS ":{S:initialStatus}
        }, 
        ReturnConsumedCapacity: "TOTAL", 
        TableName: tableName
     };
    var paramsCheckTable={TableName: tableName};
    if(checkTable(paramsCheckTable)) {
        console.log("Use Old Table");
        dynamodb.putItem(paramsPutItem,async function(err, data) {
            console.log("Start PUT Data to DDB");
            if (err){
                console.log(err, err.stack); // an error occurred
                callback(err.stack);
            }
            else {
                console.log(data);   
                // successful response
                callback(null,data);
            }
        });
    }else{
        callback("No Table");
        // setTimeout(async function(){ 
        //     await callback(putDDB); 
        // }, 20000);
    }
    
    
    
    function lpad(value, padding) {
        var zeroes = new Array(padding+1).join("0");
        return (zeroes + value).slice(-padding);
    }
    async function checkTable(paramsTableInput) {
        return new Promise((resolve, reject) => {
            dynamodb.describeTable(paramsTableInput, function(err, data) {
            console.log("paramsTable : "+JSON.stringify(paramsTableInput));
                if (err) {
                    console.log(err, err.stack); // an error occurred
                    resolve(false);
                }else{
                    console.log(data);  
                    resolve(true);
                } 
            });
        });
    }
  
};
