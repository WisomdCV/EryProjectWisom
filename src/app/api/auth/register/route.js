// src/app/api/auth/register/route.js
import { NextResponse } from 'next/server';
import { query } from '@/lib/db'; // Asumiendo que src/ está configurado como @/
import bcrypt from 'bcryptjs'; // Para hashear contraseñas

export async function POST(request) {
  try {
    const { nombre, apellido, email, password, fecha_nacimiento, telefono, direccion, ciudad, pais } = await request.json();

    // Validación básica de entrada (puedes expandirla mucho más)
    if (!nombre || !email || !password) {
      return NextResponse.json({ message: 'Nombre, email y contraseña son requeridos.' }, { status: 400 });
    }

    // Verificar si el usuario ya existe
    const existingUser = await query('SELECT id FROM usuarios WHERE email = ?', [email]);
    if (existingUser.length > 0) {
      return NextResponse.json({ message: 'El correo electrónico ya está registrado.' }, { status: 409 }); // 409 Conflict
    }

    // Hashear la contraseña
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Insertar el nuevo usuario en la base de datos
    // Asegúrate de que los nombres de columna coincidan con tu tabla 'usuarios'
    const sqlInsert = `
      INSERT INTO usuarios (nombre, apellido, email, password_hash, fecha_nacimiento, telefono, direccion, ciudad, pais, activo)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const paramsInsert = [
      nombre,
      apellido || null, // Si es opcional y no se provee, insertar NULL
      email,
      password_hash,
      fecha_nacimiento || null,
      telefono || null,
      direccion || null,
      ciudad || null,
      pais || null,
      true // Por defecto, el usuario está activo
    ];

    const result = await query(sqlInsert, paramsInsert);

    if (result.affectedRows === 1) {
      const newUser = {
        id: result.insertId,
        nombre,
        email,
        // No devuelvas el hash de la contraseña
      };
      return NextResponse.json({ message: 'Usuario registrado exitosamente.', user: newUser }, { status: 201 });
    } else {
      console.error('Failed to insert user, result:', result);
      return NextResponse.json({ message: 'Error al registrar el usuario.' }, { status: 500 });
    }

  } catch (error) {
    console.error('Error en /api/auth/register:', error);
    // Verifica si el error es por un campo UNIQUE duplicado (aunque ya lo chequeamos antes)
    if (error.code === 'ER_DUP_ENTRY') {
        return NextResponse.json({ message: 'El correo electrónico ya está registrado (error de BD).' }, { status: 409 });
    }
    return NextResponse.json({ message: 'Error interno del servidor.', error: error.message }, { status: 500 });
  }
}