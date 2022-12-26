const express = require('express');
const app = express();
const morgan = require('morgan');
const puppeteer = require('puppeteer');
const cors = require('cors');

const NodeCache = require("node-cache");

// Crea una instancia de la librería node-cache
const client = new NodeCache();

app.use(morgan('dev'));
app.use(express.urlencoded({extended:false}));
app.use(express.json());

app.use(cors({
    origin: '*'
  }));



app.get('/ok', async (req,resp)=>{

    resp.send("OK");

})


app.get('/game', async (req,resp)=>{
    
    const juegosApi=[]
   // Comprueba si los resultados de la búsqueda ya están en el cache
   const cacheKey = `${req.query.id}`;
   const result = await client.get(cacheKey);
     if (result) {
       // Devuelve los resultados desde el cache
       resp.send(JSON.parse(result));
       return;
     }
 
     // Si no hay resultados en el cache, realiza el web scraping
   
     await (async () => {
        const browser = await puppeteer.launch({headless:true,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
        });
        const page = await browser.newPage();
        console.log(req.query.id)
        await page.goto('https://www.cdkeybay.com/es');
        await page.type('.f-search',req.query.id);
        await page.click('.fa-search');
        await page.waitForSelector('.c1');
     
        const juegos = await page.evaluate(()=>{
            const elementos = document.querySelectorAll('[class="name games-name"] a');

            const juegos = [];
            for(let elemento of elementos){
                console.log(elemento.href)
                juegos.push(elemento.href);
            }
            return juegos;
        })

        console.log(juegos.length)

        
        for(let enlace of juegos){
            //console.log(enlace)
            await page.goto(enlace);
            await page.waitForSelector('.product-big');

            const juegoApi = await page.evaluate(()=>{

                const valores={};
                valores.titulo = document.querySelector('h1').innerText.replace(" cdkeys baratos","");
               const va = document.querySelector("#m > div > div.left > img").getAttribute("data-src");
               valores.img = va;
                console.log( valores.img )
                if(document.querySelectorAll('[class="button buy"]').length!=0){

                    valores.precio1= document.querySelectorAll('[class="button buy"]')[0].innerText;
                    valores.precio1+=" - "+document.querySelectorAll('[class="product-content-search"] div.name')[0].innerText

                    valores.web1= document.querySelectorAll('[class="product-platform search"]')[0].innerText; 

                    if(document.querySelectorAll('[class="button buy"]').length>=2){

                    
                        valores.precio2= document.querySelectorAll('[class="button buy"]')[1].innerText;
                        valores.precio2+=" - "+ document.querySelectorAll('[class="product-content-search"] div.name')[1].innerText
                        valores.web2= document.querySelectorAll('[class="product-platform search"]')[1].innerText; 

                        
                   }else if(document.querySelectorAll('[class="button buy"]').length>=3){
                    valores.precio3= document.querySelectorAll('[class="button buy"]')[2].innerText;
                    valores.precio3+=" - "+ document.querySelectorAll('[class="product-content-search"] div.name')[2].innerText
                    valores.web3= document.querySelectorAll('[class="product-platform search"]')[2].innerText; 
                
                   }
                    
                    
                }
               
               
                return valores;

            })
            const linksJuegos = await page.evaluate(()=>{
            
                const elementos = document.querySelectorAll('[class="product-small"]');
                
    
                const linkjuegos = [];
                for(let linkjuego of elementos){
                  
                    linkjuegos.push(linkjuego.href);
                }
                return linkjuegos;
            })

            console.log("Link :"+ linksJuegos)

            const cadenaFinal = linksJuegos.toString().split(",");

            juegoApi.link1 =cadenaFinal[0];
            juegoApi.link2 =cadenaFinal[1];
            juegoApi.link3 =cadenaFinal[2];
            juegosApi.push(juegoApi);


        }

   
        console.log(juegosApi);
        //await browser.close();
       
    })();
 
     // Almacena los resultados en el cache
     client.set(cacheKey, JSON.stringify(juegosApi), 'EX', 43200); // guarda los resultados por una hora
     console.log(juegosApi);
     resp.send(juegosApi);


    
    

    
})

app.listen(process.env.PORT || 3000, function () {
    console.log("express has started on port 3000");
  });
