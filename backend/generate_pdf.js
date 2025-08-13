import fs from 'fs';
import path from 'path';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import libre from 'libreoffice-convert';


//โหลด template word 
const content = fs.readFileSync(path.resolve("./petition_template.docx"), 'binary');
const zip = new PizZip(content);

//เติมข้อมูล
const doc = new Docxtemplater(zip);
doc.setData({
    title: "มอบอำนาจการดำเนินงานที่เกี่ยวข้องกับ “โครงการการพัฒนาผลิตภัณฑ์หัตถกรรมกะเหรี่ยงโปว์ สู่การท่องเที่ยวเชิงวัฒนธรรม ภายใต้กิจกรรมส่งเสริมการนำวิทยาศาสตร์ เทคโนโลยีและนวัตกรรม เพื่อเพิ่มศักยภาพการผลิตและเศรษฐกิจชุมชน ประจำปีงบประมาณ พ.ศ.๒๕๖๘”",
    authorizeTo: "รองศาสตราจารย์ ดร.ปิติวัฒน์ วัฒนชัย",
    position: "ผู้อำนวยการ",
    affiliation: "มหาวิทยาลัยเชียงใหม่",
    authorizeText: "ลงนามในเอกสาร สัญญา การยื่นข้อเสนอโครงการ การนำเสนอผลงาน การเจรจาต่อรอง การบริหารจัดการโครงการ การจัดส่งรายงาน การบริการวิชาการ การบริหารงบประมาณ รับเงิน เบิกจ่ายเงิน และงานอื่น ๆ ที่เกี่ยวข้อง ทั้งนี้ ให้ปฏิบัติตามพระราชบัญญัติการจัดซื้อจัดจ้างและการบริหารพัสดุภาครัฐ พ.ศ. 2560 และกฎเกณฑ์ที่ออกภายใต้พระราชบัญญัติดังกล่าว ในการดำเนินงาน “โครงการการพัฒนาผลิตภัณฑ์หัตถกรรมกะเหรี่ยงโปว์ สู่การท่องเที่ยวเชิงวัฒนธรรม ภายใต้กิจกรรมส่งเสริมการนำวิทยาศาสตร์ เทคโนโลยีและนวัตกรรม เพื่อเพิ่มศักยภาพการผลิตและเศรษฐกิจชุมชน ประจำปีงบประมาณ พ.ศ.๒๕๖๘” ตลอดจนดำเนินการอื่นใดที่เกี่ยวข้องจนเสร็จการ"
})

try{
    doc.render();
}catch (error){
    console.error("Render error", error);
}

//บันทึกไฟล์ เป็น pdf 
const buf = doc.getZip().generate({ type: 'nodebuffer'});
fs.writeFileSync("./output.docx", buf);

libre.convert(buf, '.pdf', undefined, (err, done) =>{
    if (err){
        console.error('error converting file: ${err}');
        return;
    }

    fs.writeFileSync(".output.pdf", done);
    console.log('ไฟล์ PDF ถูกสร้างแล้ว')

});