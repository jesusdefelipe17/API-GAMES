const express = require('express');
const app = express();
const morgan = require('morgan');
const puppeteer = require('puppeteer');

app.use(morgan('dev'));
app.use(express.urlencoded({extended:false}));
app.use(express.json());


app.get('/game', async (req,resp)=>{

    const juegosApi =[];

    (async () =>{
        const browser = await puppeteer.launch({headless:false,
        args:[
            '--no-sandbox',
            '--disable-setuid-sandbox',
            ],
        });
        const page = await browser.newPage();
    
        console.log(req.query.id)
        await page.goto('https://www.cdkeybay.com/es');
        await page.type('.f-search',req.query.id);
        await page.screenshot({path:'imagen1.jpg'});
        await page.click('.fa-search');
        await page.waitForSelector('.c1');
        await page.waitForTimeout(5000)
        await page.screenshot({path:'imagen2.jpg'});

   /*
        const linksJuegos = await page.evaluate(()=>{
            
            const elementos = document.querySelectorAll('[class="product-small"] a');
            console.log(elementos)

            const linkjuegos = [];
            for(let linkjuego of elementos){
                console.log(linkjuego.href)
                linkjuegos.push(linkjuego.href);
            }
            return linkjuegos;
        })
     */
     
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
        resp.send(juegosApi)
    })();
    

    
})

app.listen(process.env.PORT || 3000, function () {
    console.log("express has started on port 3000");
  });

  