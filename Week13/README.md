学习笔记

## HTML的定义：XML与SGML
[https://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd]
[https://www.w3.org/1999/xhtml]


## HTML 语义标签
[https://developer.mozilla.org/zh-CN/docs/conflicting/Web/HTML/Element]


## HTML 语法

- 合法元素：
  - Element: < tagname >
  - Text: text
  - Comment: < !-- comments -- >
  - DocumentType: < !Doctype html >
  - ProcessingInstruction: < ?a 1? >
  - CDATA: < ![ CDATA[ ] ] >

- 字符引用
  - &#160 ;  ==> nbsp ==> space
  - &amp ;   ==> &
  - &lt ;    ==> <
  - &quot ;  ==> "


## DOM API

- 导航类操作
  - parentNode
  - childNodes
  - firstChild
  - lastChild
  - nextSibling
  - previousSibling

  - parentElement
  - children
  - firstElementChild
  - lastElementChild
  - nextElementSibling
  - previousElementSibling

- 修改操作
  - appendChild
  - insertBefore
  - removeChild
  - replaceChild

- 高级操作
  - compareDocumentPosition (用于比较两个节点关系)
  - contains (检查一个节点是否包含另一个节点)
  - isEqualNode (检查两个节点是否完全相同)
  - isSameNode (检查两个节点是否是同一个节点)
  - cloneNode (复制一个节点，传入参数true则深拷贝)


## Range API

- range.extractContents
- range.insertNode


## CSSOM

- document.styleSheets
- window.getComputedStyle()


## CSSOM View

- window
  - window.innerHeight，window.innerWidth
  - window.outerHeight，window.outerWidth
  - window.devicePixelRatio
  - window.screen

- Scroll
  - scrollTop
  - scrollLeft
  - scrollWidth
  - scrollHeight
  - scroll(x,y)
  - scrollBy(x,y)
  - scrollIntoView()

  - window.scrollX
  - window.scrollY
  - window.scroll(x,y)
  - window.scrollBy(x,y)

- layout
  - getClientRects()
  - getBoundingClientRect()