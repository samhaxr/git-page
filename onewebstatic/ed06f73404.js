document.addEventListener('DOMContentLoaded',function(){var nodes,node,i,dataSpecificKind;nodes=document.querySelectorAll('div[data-id]');for(i=0;i<nodes.length;i++){node=nodes[i];(function(node){dataSpecificKind=node.getAttribute('data-specific-kind');if(dataSpecificKind&&dataSpecificKind!=='CODE'&&dataSpecificKind!=='WEBSHOP'){node.addEventListener('click',function(event){event.stopPropagation()})}}(node))}nodes=document.querySelectorAll('div[data-link=\'we-link\']');for(i=0;i<nodes.length;i++){node=nodes[i];var classNames=node.getAttribute('class');var href=node.firstChild.getAttribute('href');if(classNames&&classNames.indexOf('shinybox')>-1){node.setAttribute('href',href);continue}var target=node.getAttribute('target');(function(node,href,target){node.addEventListener('click',function(event){event.stopPropagation();window.open(href,target||'_self')})}(node,href,target))}nodes=document.querySelectorAll('a[data-stop-propagation=\'true\']');for(i=0;i<nodes.length;i++){node=nodes[i];(function(node){node.addEventListener('click',function(event){event.stopPropagation()})}(node))}});