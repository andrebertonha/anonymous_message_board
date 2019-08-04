const mongo = require('mongodb').MongoClient
const ObjectId = require('mongodb').ObjectID
var dbUrl = process.env.DB
const mongoose = require('mongoose')

function ThreadHandler() {
  
  this.threadList = (req, res) => {
    const board = req.params.board;
    mongoose.connect(dbUrl, {useNewUrlParser: true}, (err, db) => {      
      db.collection(board).find(
        {},
        {
          reported: 0,
          delete_password: 0,
          "replies.delete_password": 0,
          "replies.reported": 0
        })
      .sort({bumped_on: -1})
      .limit(10)      
      .toArray( (err,docs) => {
        if(err) console.log(err)        
        docs.forEach(function(doc){        
          doc.replycount = doc.replies.length;
          if(doc.replies.length > 3) {
            doc.replies = doc.replies.slice(-3);
          }
        });        
        res.json(docs);
      });     
    })
  }
  
  
  this.newThread = function(req, res) {
    var board = req.params.board;
    var thread = {
      text: req.body.text,
      created_on: new Date(),
      bumped_on: new Date(),
      reported: false,
      delete_password: req.body.delete_password,
      replies: []
    };
    mongoose.connect(dbUrl, { useNewUrlParser: true }, function(err,db) {
      var collection = db.collection(board);
      collection.insertOne(thread, function(){
        res.redirect('/b/'+board+'/');
      });
    });
  };
  
  //reported_id name
  this.reportThread = function(req, res) {
    var board = req.params.board;
    mongoose.connect(dbUrl, { useNewUrlParser: true }, function(err,db) {
      var collection = db.collection(board);
      collection.findOneAndUpdate(
        {_id: new ObjectId(req.body.thread_id)},        
        {$set: {reported: true}},
        function(err, doc){
          if(err) throw err
        });
    });
    res.send('reported');
  };
  
  //check doc return to return right res
  this.deleteThread = function(req, res) {
    var board = req.params.board;
    mongoose.connect(dbUrl, {useNewUrlParser: true}, function(err,db) {
      var collection = db.collection(board);
      collection.findOne(
        {
          _id: new ObjectId(req.body.thread_id)          
        },
        function(err, doc){
          if (doc.delete_password !== req.body.delete_password) {
            res.send('incorrect password');
          } else {
            collection.deleteOne({ _id: new ObjectId(req.body.thread_id) }, (err, result) => {
              if(err) throw err //console.log(err)
              else res.send('success');
            })            
          }
        });
        
    });
  };
  
}

module.exports = ThreadHandler