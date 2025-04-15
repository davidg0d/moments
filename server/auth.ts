import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as UserType, InsertUser } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends UserType {}
  }
}

const scryptAsync = promisify(scrypt);

// Hash de senha usando scrypt
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

// Compara��o segura de senha
async function comparePasswords(supplied: string, stored: string): Promise<boolean> {
  if (!stored.includes(".")) {
    console.error("Formato de senha inv�lido");
    return false;
  }

  try {
    const [hashed, salt] = stored.split(".");
    const hashedBuf = Buffer.from(hashed, "hex");
    const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
    return timingSafeEqual(hashedBuf, suppliedBuf);
  } catch (error) {
    console.error("Erro na compara��o de senhas:", error);
    return false;
  }
}

export function setupAuth(app: Express) {
  const isProduction = process.env.NODE_ENV === "production";

  const cookieSettings = {
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 dias
    httpOnly: true,
    secure: isProduction && process.env.HTTPS === "true", // Apenas em produ��o com HTTPS habilitado
    sameSite: isProduction ? "strict" : "lax", // Seguran�a refor�ada em produ��o
  };

  // Configurar sess�es
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "development-secret-key",
      resave: false,
      saveUninitialized: false,
      store: storage.sessionStore,
      cookie: cookieSettings,
    })
  );

  app.use(passport.initialize());
  app.use(passport.session());

  // Estrat�gia de autentica��o
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);

        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false, { message: "Credenciais inv�lidas" });
        }

        return done(null, user);
      } catch (err) {
        return done(err);
      }
    })
  );

  // Serializar usu�rio na sess�o
  passport.serializeUser((user: UserType, done) => {
    done(null, user.id);
  });

  // Desserializar usu�rio da sess�o
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      if (!user) {
        return done(null, false);
      }
      done(null, user);
    } catch (err) {
      done(err, null);
    }
  });

  // Middlewares de autentica��o e autoriza��o
  const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Acesso n�o autorizado" });
    }
    next();
  };

  const isAdmin = (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated() || req.user.role !== "admin") {
      return res.status(403).json({ error: "Acesso restrito a administradores" });
    }
    next();
  };

  const isShopOwner = (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated() || (req.user.role !== "shopowner" && req.user.role !== "admin")) {
      return res.status(403).json({ error: "Acesso restrito a lojistas" });
    }
    next();
  };

  const isCustomer = (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated() || !["customer", "shopowner", "admin"].includes(req.user.role)) {
      return res.status(403).json({ error: "Acesso restrito a clientes" });
    }
    next();
  };

  const hasActiveSubscription = async (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated() || req.user.role !== "shopowner") {
      return res.status(403).json({ error: "Acesso restrito a lojistas com assinatura ativa" });
    }
    const shopOwner = await storage.getShopOwnerByUserId(req.user.id);
    if (!shopOwner || shopOwner.subscriptionStatus !== "active") {
      return res.status(402).json({ error: "Assinatura necess�ria" });
    }
    next();
  };

  // Adiciona os middlewares ao app.locals
  app.locals.authMiddleware = {
    isAuthenticated,
    isAdmin,
    isShopOwner,
    isCustomer,
    hasActiveSubscription,
  };

  // Rota de registro de usu�rio
  app.post("/api/register", async (req, res, next) => {
    try {
      const { username, password, email, name, role = "customer" } = req.body;

      if (await storage.getUserByUsername(username)) {
        return res.status(400).json({ error: "Nome de usu�rio j� existe" });
      }

      const hashedPassword = await hashPassword(password);
      const userData: InsertUser = { username, password: hashedPassword, email, name, role };
      const user = await storage.createUser(userData);

      req.login(user, (err) => {
        if (err) return next(err);
        const { password, ...userWithoutPassword } = user;
        return res.status(201).json(userWithoutPassword);
      });
    } catch (err) {
      return next(err);
    }
  });
}