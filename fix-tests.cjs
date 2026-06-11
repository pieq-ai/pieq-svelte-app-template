const fs = require('fs');
const p1 = 'tests/unit/designation.service.test.ts';
let c1 = fs.readFileSync(p1, 'utf8');
c1 = c1.replace(/getDesignationById/g, 'getDesignationByCuid');
c1 = c1.replace(/getDesignationByCuid2/g, 'getDesignationByCuid');
c1 = c1.replace(/1n/g, "'abc'");
c1 = c1.replace(/999n/g, "'999'");
fs.writeFileSync(p1, c1, 'utf8');

const p2 = 'tests/unit/system-role.dao.test.ts';
let c2 = fs.readFileSync(p2, 'utf8');
c2 = c2.replace(/system_role_name/g, 'name');
fs.writeFileSync(p2, c2, 'utf8');

const p3 = 'tests/unit/system-role.service.test.ts';
let c3 = fs.readFileSync(p3, 'utf8');
c3 = c3.replace(/system_role_name/g, 'name');
fs.writeFileSync(p3, c3, 'utf8');

const p4 = 'tests/unit/salary-component.validator.test.ts';
if (fs.existsSync(p4)) {
  let c4 = fs.readFileSync(p4, 'utf8');
  c4 = c4.replace(/component_name/g, 'name');
  fs.writeFileSync(p4, c4, 'utf8');
}
console.log('Fixed unit test names');
