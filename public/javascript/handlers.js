function choosePage(selectElt) {
    console.log(selectElt.parentElement);
    let formElt = selectElt.parentElement;
    formElt.action = selectElt.value;
    //selectElt.form.action = selectElt.value;
}
