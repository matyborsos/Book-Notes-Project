import express from "express"
import pg from "pg"
import bodyParser from "body-parser"
import axios from "axios"
import env from "dotenv";

env.config();

const db = new pg.Client({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT,
});

try {
    await db.connect();
    console.log("Connected to the database");
} catch (error) {
    console.error("Error connecting to the database:", error);
}

const app = express();
const port = 3000;
var currentId = 1;

app.set('view engine', 'pug')

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

let items = [
    {
        id: 1,
        title: 'The Chronicles of Narnia: The Lion, the Witch and the Wardrobe',
        author: 'Clive Staples Lewis',
        review: 'I loved this book so much when I was a child!',
        imageSrc: 'http://books.google.com/books/content?id=okroEAAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api',
        description: `"The Lion, the Witch and the Wardrobe" is the enchanting first installment in C.S. Lewis's timeless fantasy series, "The Chronicles of Narnia." The story unfolds with the discovery of a magical world beyond the back of a wardrobe, where four siblings—Peter, Susan, Edmund, and Lucy Pevensie—stumble upon the wondrous land of Narnia. In Narnia, the land is under the oppressive rule of the White Witch, who has plunged the realm into eternal winter. The arrival of the Pevensie children coincides with the prophecies of a great and benevolent lion, Aslan, who represents the forces of good. The siblings find themselves embroiled in a epic struggle between good and evil, as they join forces with talking animals, mythical creatures, and the majestic Aslan to overthrow the White Witch. Filled with themes of courage, sacrifice, and the triumph of good over evil, "The Lion, the Witch and the Wardrobe" captivates readers with its magical world and memorable characters. Lewis's storytelling prowess and allegorical elements provide depth to the narrative, making it a beloved classic that transcends generations. The novel continues to be cherished for its imaginative richness and profound exploration of timeless virtues.`,
        publishedDate: '2023-12-08',
        categories: 'Literary Collections',
        pageCount: 121,
        date: '2024-01-21T17:52:51.036Z',
        score: 9
    }
]

app.get("/new.ejs", async (req,res) => {
    res.render("new.ejs");
});

app.get("/new", async (req,res) => {
    const itemId = req.query.updatedItemId;
    const result = await db.query(`SELECT * FROM book WHERE id = ${itemId}`);
    items = result.rows;
    currentId = itemId;
    res.render("new.ejs", { listItems: items });
});

app.get("/", async (req,res) => {
    const result = await db.query("SELECT * FROM book");
    items = result.rows;
    res.render("index.ejs", { listItems: items });
});

app.get("/rating", async (req,res) => {
    const result = await db.query("SELECT * FROM book ORDER BY score DESC");
    items = result.rows;
    res.render("index.ejs", { listItems: items });
});

app.get("/recency-r", async (req,res) => {
    const result = await db.query("SELECT * FROM book ORDER BY date DESC");
    items = result.rows;
    res.render("index.ejs", { listItems: items });
});

app.get("/recency-p", async (req,res) => {
    const result = await db.query("SELECT * FROM book ORDER BY publisheddate DESC");
    items = result.rows;
    res.render("index.ejs", { listItems: items });
});


app.post("/add", async (req,res) => {
    try{
    var bookTitle = req.body.title;
    var author = req.body.author;
    var review = req.body.review; 
    var score = req.body.score;

    var url = "https://www.googleapis.com/books/v1/volumes?q=intitle:\"" + bookTitle + "\"&inauthor:\"" + author + "\"&langRestrict=en";
    var urlEncoded = encodeURI(url);
    var result = await axios(url);
    
    var items = result.data.items[0];

    var item = items.volumeInfo;


    var imageSrc = item.imageLinks.thumbnail;
    var description = item.description;
    if(item.publishedDate.length == 4)
        var publishedDate = "01-01-" + item.publishedDate;
    var categories = item.categories;
    var pageCount = item.pageCount;

    await db.query("INSERT INTO book(title, author, review, imageSrc, description, publishedDate, categories, pageCount, date, score ) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)", [bookTitle, author, review, imageSrc, description, publishedDate, categories, pageCount, new Date(), score]);


    res.redirect("/");
    }
    catch(err){
        res.send("Sorry some information about the book where not found! Try another one!");
    }
});


app.post("/edit", async (req, res) => {
    const itemId = currentId;
    var bookTitle = req.body.title;
    var author = req.body.author;
    var review = req.body.review; 
    var score = req.body.score;
    var date = req.body.date;
    var description = req.body.description;
    var publishedDate = req.body.publisheddate;
    var categories = req.body.categories;
    var pageCount = req.body.pagecount;
    await db.query("UPDATE book SET title = $1, author = $2, review = $3, description = $4, publisheddate = $5, categories = $6, pagecount = $7, date = $8, score = $9 WHERE id = $10", [bookTitle, author, review, description, publishedDate, categories, pageCount, date, score, itemId] );
    res.redirect("/");
  });

  
app.post("/delete", async (req, res) => {
    const itemId = req.body.deleteItemId;
    console.log(itemId);
    await db.query("DELETE FROM book WHERE id = $1", [itemId] );
    res.redirect("/");
});


app.listen(port, () => {
    console.log(`Listening to port ${port}:`);
});


