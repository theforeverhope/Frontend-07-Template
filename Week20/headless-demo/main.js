const puppeteer = require('puppeteer');
 
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:8080/main.html'); // 这里写自己项目的地址
  
  const a = await page.$("a"); // 解析项目中的 Dom 树
  const img = await page.$$("a"); // 解析项目中的 Dom 树
 
  console.log(a.asElement().boxModel(), img); // 打印观察结果
})();