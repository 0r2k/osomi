import test from 'node:test';
import assert from 'node:assert/strict';
import { safeNext, validEmail, validPassword, validPreference, parseVisitor } from '../src/lib/auth-input.mjs';
test('retornos de Auth se restringen a destinos internos conocidos',()=>{
 for(const path of ['https://evil.test','//evil.test','/\\evil.test','/mi-cuenta?next=https://evil.test','%2f%2fevil.test',null]) assert.equal(safeNext(path),'/mi-cuenta');
 assert.equal(safeNext('/actualizar-contrasena'),'/actualizar-contrasena');
});
test('entradas de cuenta y preferencia rechazan valores inesperados',()=>{
 assert.ok(validEmail('persona@example.test')); assert.ok(!validEmail('bad\n@example.test'));
 assert.ok(validPassword('Una clave larga 29!')); assert.ok(!validPassword('corta'));
 assert.ok(validPreference({active:false,revision:0,requestId:crypto.randomUUID()}));
 assert.ok(!validPreference({active:'false',revision:0,requestId:crypto.randomUUID()}));
 assert.ok(!validPreference({active:true,revision:-1,requestId:crypto.randomUUID()}));
});
test('cookie visitante exige UUID y secreto de 32 bytes',()=>{
 assert.equal(parseVisitor('inventada'),null);
 const id=crypto.randomUUID(); assert.deepEqual(parseVisitor(id+'.'+'a'.repeat(64)),{id,secret:'a'.repeat(64)});
 assert.equal(parseVisitor(id+'.'+'a'.repeat(63)),null);
});
