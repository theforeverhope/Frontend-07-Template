import { Component, createElement } from './framework.js';
import { Carousel } from './Carousel.js';
import { Button } from './Button.js';
import { List } from './List.js';

let pics = [
  {
    img: "https://static001.geekbang.org/resource/image/bb/21/bb38fb7c1073eaee1755f81131f11d21.jpg",
    url: "https://www.google.com/",
    title: "google"
  },
  {
    img: "https://static001.geekbang.org/resource/image/1b/21/1b809d9a2bdf3ecc481322d7c9223c21.jpg",
    url: "https://cn.bing.com/",
    title: "bing"
  },
  {
    img: "https://static001.geekbang.org/resource/image/b6/4f/b6d65b2f12646a9fd6b8cb2b020d754f.jpg",
    url: "https://search.yahoo.com",
    title: "yahoo"
  },
  {
    img:  "https://static001.geekbang.org/resource/image/73/e4/730ea9c393def7975deceb48b3eb6fe4.jpg",
    url: "https://www.baidu.com/",
    title: "baidu"
  },
]

let a = <Carousel src={pics} 
  onChange={e => console.log(e.detail.position)}
  onClick={e => console.log(e.detail.data.url)}/>;
a.mountTo(document.body);

let b = <Button>Button content</Button>;
b.mountTo(document.body);

let l = <List data={pics}>
  {
    (record) => <div>
      <img src={record.img} />
      <a herf={record.url}>{record.title}</a>
    </div>
  }
</List>;
l.mountTo(document.body);
