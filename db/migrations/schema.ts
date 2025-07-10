import { pgTable, foreignKey, text, timestamp, unique, boolean, integer, jsonb, uuid, primaryKey } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const accounts = pgTable("accounts", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	ownerId: text("owner_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.ownerId],
			foreignColumns: [user.id],
			name: "accounts_owner_id_user_id_fk"
		}).onDelete("cascade"),
]);

export const user = pgTable("user", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	email: text().notNull(),
	emailVerified: boolean().default(false).notNull(),
	image: text(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	role: text().default('client').notNull(),
}, (table) => [
	unique("user_email_unique").on(table.email),
]);

export const session = pgTable("session", {
	id: text().primaryKey().notNull(),
	expiresAt: timestamp({ mode: 'string' }).notNull(),
	token: text().notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	ipAddress: text(),
	userAgent: text(),
	userId: text().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "session_userId_user_id_fk"
		}).onDelete("cascade"),
	unique("session_token_unique").on(table.token),
]);

export const verification = pgTable("verification", {
	id: text().primaryKey().notNull(),
	identifier: text().notNull(),
	value: text().notNull(),
	expiresAt: timestamp({ mode: 'string' }).notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
});

export const account = pgTable("account", {
	id: text().primaryKey().notNull(),
	accountId: text().notNull(),
	providerId: text().notNull(),
	userId: text().notNull(),
	accessToken: text(),
	refreshToken: text(),
	idToken: text(),
	accessTokenExpiresAt: timestamp({ mode: 'string' }),
	refreshTokenExpiresAt: timestamp({ mode: 'string' }),
	scope: text(),
	password: text(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "account_userId_user_id_fk"
		}).onDelete("cascade"),
]);

export const accountMembers = pgTable("account_members", {
	userId: text("user_id").notNull(),
	accountId: text("account_id").notNull(),
	role: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "account_members_user_id_user_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.accountId],
			foreignColumns: [accounts.id],
			name: "account_members_account_id_accounts_id_fk"
		}).onDelete("cascade"),
]);

export const subscription = pgTable("subscription", {
	id: text().primaryKey().notNull(),
	createdAt: timestamp({ mode: 'string' }).notNull(),
	modifiedAt: timestamp({ mode: 'string' }),
	amount: integer().notNull(),
	currency: text().notNull(),
	recurringInterval: text().notNull(),
	status: text().notNull(),
	currentPeriodStart: timestamp({ mode: 'string' }).notNull(),
	currentPeriodEnd: timestamp({ mode: 'string' }).notNull(),
	cancelAtPeriodEnd: boolean().default(false).notNull(),
	canceledAt: timestamp({ mode: 'string' }),
	startedAt: timestamp({ mode: 'string' }).notNull(),
	endsAt: timestamp({ mode: 'string' }),
	endedAt: timestamp({ mode: 'string' }),
	customerId: text().notNull(),
	productId: text().notNull(),
	discountId: text(),
	checkoutId: text().notNull(),
	customerCancellationReason: text(),
	customerCancellationComment: text(),
	metadata: text(),
	customFieldData: text(),
	userId: text(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "subscription_userId_user_id_fk"
		}),
]);

export const plans = pgTable("plans", {
	planId: text("plan_id").primaryKey().notNull(),
	name: text().notNull(),
	monthlyPrice: integer("monthly_price"),
	annualPrice: integer("annual_price"),
	stripePriceId: text("stripe_price_id"),
	stripeProductId: text("stripe_product_id"),
	maxSites: integer("max_sites"),
	maxUsers: integer("max_users"),
});

export const features = pgTable("features", {
	featureKey: text("feature_key").primaryKey().notNull(),
	description: text().notNull(),
});

export const settings = pgTable("settings", {
	key: text().primaryKey().notNull(),
	value: jsonb().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
});

export const ozzaAccounts = pgTable("ozza_accounts", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	schemaName: text("schema_name").notNull(),
	accountName: text("account_name").notNull(),
	planId: text("plan_id").notNull(),
	planStatus: text("plan_status").default('active').notNull(),
	stripeCustomerId: text("stripe_customer_id"),
	maintenanceMode: boolean("maintenance_mode").default(false).notNull(),
	logoUrl: text("logo_url"),
	primaryColor: text("primary_color"),
	secondaryColor: text("secondary_color"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.planId],
			foreignColumns: [plans.planId],
			name: "ozza_accounts_plan_id_fkey"
		}),
	unique("ozza_accounts_schema_name_key").on(table.schemaName),
]);

export const userProfiles = pgTable("user_profiles", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	phoneNumber: text("phone_number"),
	address: text(),
	metadata: jsonb(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("user_profiles_user_id_key").on(table.userId),
]);

export const clientInvitations = pgTable("client_invitations", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	token: text().notNull(),
	clientName: text("client_name").notNull(),
	clientEmail: text("client_email").notNull(),
	accountId: uuid("account_id").notNull(),
	expiresAt: timestamp("expires_at", { withTimezone: true, mode: 'string' }).notNull(),
	status: text().default('pending').notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.accountId],
			foreignColumns: [ozzaAccounts.id],
			name: "client_invitations_account_id_fkey"
		}).onDelete("cascade"),
	unique("client_invitations_token_key").on(table.token),
]);

export const domains = pgTable("domains", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	accountId: uuid("account_id").notNull(),
	host: text().notNull(),
	siteId: uuid("site_id"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.accountId],
			foreignColumns: [ozzaAccounts.id],
			name: "domains_account_id_fkey"
		}).onDelete("cascade"),
	unique("domains_host_key").on(table.host),
]);

export const billingEvents = pgTable("billing_events", {
	id: text().primaryKey().notNull(),
	eventType: text("event_type").notNull(),
	accountId: uuid("account_id"),
	raw: jsonb().notNull(),
	processedAt: timestamp("processed_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.accountId],
			foreignColumns: [ozzaAccounts.id],
			name: "billing_events_account_id_fkey"
		}).onDelete("cascade"),
]);

export const ozzaAccountMembers = pgTable("ozza_account_members", {
	accountId: uuid("account_id").notNull(),
	userId: text("user_id").notNull(),
	role: text().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.accountId],
			foreignColumns: [ozzaAccounts.id],
			name: "ozza_account_members_account_id_fkey"
		}).onDelete("cascade"),
	primaryKey({ columns: [table.accountId, table.userId], name: "ozza_account_members_pkey"}),
]);

export const accountFeatures = pgTable("account_features", {
	accountId: uuid("account_id").notNull(),
	featureKey: text("feature_key").notNull(),
	enabled: boolean().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.accountId],
			foreignColumns: [ozzaAccounts.id],
			name: "account_features_account_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.featureKey],
			foreignColumns: [features.featureKey],
			name: "account_features_feature_key_fkey"
		}).onDelete("cascade"),
	primaryKey({ columns: [table.accountId, table.featureKey], name: "account_features_pkey"}),
]);
