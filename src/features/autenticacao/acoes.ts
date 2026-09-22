"use server";

import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { z } from "zod";

import { auth, signIn, signOut } from "@/auth";
import { clientePrisma } from "@/src/shared/api/prisma";

const schemaCadastro = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  senha: z.string().min(8, "Senha deve ter pelo menos 8 caracteres"),
});

const schemaEntrar = z.object({
  email: z.string().email("Email inválido"),
  senha: z.string().min(1, "Senha é obrigatória"),
});

type ResultadoAcao = { sucesso: false; mensagem: string } | { sucesso: true };

export async function cadastrar(
  _estado: ResultadoAcao | null,
  formData: FormData
): Promise<ResultadoAcao> {
  const parsed = schemaCadastro.safeParse({
    nome: formData.get("nome"),
    email: formData.get("email"),
    senha: formData.get("senha"),
  });

  if (!parsed.success) {
    return {
      sucesso: false,
      mensagem: parsed.error.issues[0].message,
    };
  }

  const { nome, email, senha } = parsed.data;

  const usuarioExistente = await clientePrisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (usuarioExistente) {
    return { sucesso: false, mensagem: "Este email já está em uso" };
  }

  const senhaHash = await bcrypt.hash(senha, 12);

  await clientePrisma.user.create({
    data: { name: nome, email, passwordHash: senhaHash },
  });

  await signIn("credentials", { email, senha, redirectTo: "/dashboard" });

  return { sucesso: true };
}

export async function entrar(
  _estado: ResultadoAcao | null,
  formData: FormData
): Promise<ResultadoAcao> {
  const parsed = schemaEntrar.safeParse({
    email: formData.get("email"),
    senha: formData.get("senha"),
  });

  if (!parsed.success) {
    return {
      sucesso: false,
      mensagem: parsed.error.issues[0].message,
    };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      senha: parsed.data.senha,
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      if (error.type === "CredentialsSignin") {
        return { sucesso: false, mensagem: "Email ou senha incorretos" };
      }
      return { sucesso: false, mensagem: "Algo deu errado. Tente novamente." };
    }
    throw error;
  }

  return { sucesso: true };
}

export async function sair(): Promise<void> {
  await signOut({ redirectTo: "/login" });
}

export async function obterSessao() {
  return auth();
}
