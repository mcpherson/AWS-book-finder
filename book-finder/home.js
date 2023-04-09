// adjust vertical alignment of home content
const setMarginTop = function() {

    let homeContainer = document.getElementById('container')
    let homeHeight = homeContainer.offsetHeight
    homeContainer.style.marginTop = `${(window.innerHeight - homeHeight) / 2.7}px`

}

window.addEventListener('resize', setMarginTop)

window.onload = () => {
    
    setUserState() // in global js file
    Array.from(document.getElementsByTagName('html'))[0].style.visibility = 'visible'

    setMarginTop()
    
}