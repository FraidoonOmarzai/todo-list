const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require("mongoose");
const _ = require("lodash");
const date = require(__dirname + "/date.js");

const app = express();

// using ejs templating
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
   extended: true
}));
app.use(express.static('public'));

// we are gonna create a db called todoDB
mongoose.connect("mongodb://localhost:27017/todoDB", {
   useNewUrlParser: true,
   useUnifiedTopology: true
});

// create schema
const itemSchema = new mongoose.Schema({
   name: String
});

const Item = mongoose.model("Item", itemSchema);

// adding three items(1-3)
const item1 = new Item({
   name: "Prayer"
});
const item2 = new Item({
   name: "Study"
});
const item3 = new Item({
   name: "Exercise"
});

const defaultItems = [item1, item2, item3];

const listSchema = {
   name: String,
   items: [itemSchema]
};

const List = new mongoose.model("List", listSchema);

app.get('/', (req, res) => {

   const day = date.getDate();

   Item.find({}, (err, foundItems) => {
      // check if their is no items we are adding defaultItems
      if (foundItems.length === 0) {
         Item.insertMany(defaultItems, err => {
            if (err) {
               console.log(err);
            } else {
               console.log("defaultItems are added successfully");
            }
         });
         res.redirect("/");
      } else {
         res.render('list', {
            listTitle: day,
            newListItems: foundItems
         });
      }
   });
});

// creating custom list using express route paramaters
app.get("/:customListName", (req, res) => {
   const customListName = _.capitalize(req.params.customListName);

   List.findOne({
         name: customListName
      },
      (err, foundList) => {
         if (!err) {
            if (!foundList) {
               // create new one
               const list = new List({
                  name: customListName,
                  items: defaultItems
               });
               list.save();
               res.redirect("/" + customListName)
            } else {
               // already exist just display it
               res.render("list", {
                  listTitle: foundList.name,
                  newListItems: foundList.items
               })
            }
         }
      })
});

app.post('/', (req, res) => {

   const newItem = req.body.newItem;
   const listName = req.body.list;

   const item = new Item({
      name: newItem
   });

   const day = date.getDay()+",";

   // adding new item first check the custom list name
   if (listName === day) {
      item.save();
      res.redirect("/");
   } else {
      // if its not today we have to check for the custom list and than add it
      List.findOne({
         name: listName
      }, (err, foundList) => {
         foundList.items.push(item);
         foundList.save();
         res.redirect("/" + listName);
      });
   }
});

app.post("/delete", (req, res) => {
   const checkedItemID = req.body.checkbox;
   const listName = req.body.listName;

   const day = date.getDate();

   if (listName === day) {
      Item.findByIdAndRemove(checkedItemID, err => {
         if (!err) {
            console.log("deleted successfully!");
            res.redirect("/");
         }
      });
   } else {
      // find the custom list and than remove the item form array
      List.findOneAndUpdate({
            name: listName
         }, {
            $pull: {
               items: {
                  _id: checkedItemID
               }
            }
         },
         (err, foundList) => {
            if (!err) {
               res.redirect("/" + listName);
            }
         }
      )
   }
});

app.listen(3000, () => {
   console.log('running on port 3000');
});
