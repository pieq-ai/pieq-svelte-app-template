import fs from 'fs';
import path from 'path';

function walk(dir) {
	let results = [];
	const list = fs.readdirSync(dir);
	list.forEach(function (file) {
		file = path.resolve(dir, file);
		const stat = fs.statSync(file);
		if (stat && stat.isDirectory()) {
			results = results.concat(walk(file));
		} else if (file.endsWith('.ts') || file.endsWith('.svelte')) {
			results.push(file);
		}
	});
	return results;
}

const files = walk('./src');
files.forEach((f) => {
	let content = fs.readFileSync(f, 'utf-8');
	const orig = content;

	content = content.replace(/<option value="active">Active<\/option>/g, '<option value={true}>Active</option>');
	content = content.replace(/<option value="inactive">Inactive<\/option>/g, '<option value={false}>Inactive</option>');
	content = content.replace(/'Status must be "active" or "inactive"'/g, "'Status must be a boolean'");
    content = content.replace(/>\s*\{dept.status\}\s*<\/Badge>/g, '>{dept.status ? \'Active\' : \'Inactive\'}</Badge>');
    content = content.replace(/>\s*\{role.status\}\s*<\/Badge>/g, '>{role.status ? \'Active\' : \'Inactive\'}</Badge>');
    content = content.replace(/>\s*\{permission.status\}\s*<\/Badge>/g, '>{permission.status ? \'Active\' : \'Inactive\'}</Badge>');
    content = content.replace(/>\s*\{designation.status\}\s*<\/Badge>/g, '>{designation.status ? \'Active\' : \'Inactive\'}</Badge>');

	if (content !== orig) {
		fs.writeFileSync(f, content);
		console.log('Updated ' + f);
	}
});
