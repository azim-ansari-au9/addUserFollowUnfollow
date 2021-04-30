const express =require('express');
const bodyParser =require('body-parser');
const cors =require('cors');
const morgan =require('morgan');
const mongoInit =require('./connectionDb/mongoConnection');
const userRouter =require('./routes/userRoutes');
var cookieParser = require('cookie-parser');
const path = require('path')

const app = express();
mongoInit();

//static file
// app.use(express.static('../frontend/build'))
//     const path = require('path')
//     app.get("*",(req,res)=>{
//         res.sendFile(path.resolve(__dirname,'frontend','build','index.html'))
//     })

//middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cors());
app.use(morgan('dev'));
app.use(cookieParser());
app.use('/uploads' , express.static(path.join(__dirname, 'public/uploads')));



//user Routes
app.use('/api',userRouter)

const port = process.env.PORT || 3000;

//setting up custom error message for routes 
app.use((req, res, next) => {
    const error = new Error('This APIs does not exist');
    error.status = 404;
    next(error);
});

//Error handler function`
app.use((error, req, res, next) => {
    res.status(error.status || 500);
    res.json({
        error: {
            message: error.message
        }
    });
});

//cors
app.all('*', function (req, res, next) {
    res.header("Access-Control-Allow-Origin", '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-type,Accept,X-Access-Token,X-Key');
    if (req.method == 'OPTIONS') {
      res.status(200).end();
    } else {
      next();
    }
  });

app.listen(port,(err)=>{
    if(err){
        return res.status(404).json({message:"Server Error "})
    }
    console.log(`Server is running on port : ${port} `)
})