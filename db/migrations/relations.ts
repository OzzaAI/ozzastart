import { relations } from "drizzle-orm/relations";
import { user, accounts, session, account, accountMembers, subscription, plans, ozzaAccounts, clientInvitations, domains, billingEvents, ozzaAccountMembers, accountFeatures, features } from "./schema";

export const accountsRelations = relations(accounts, ({one, many}) => ({
	user: one(user, {
		fields: [accounts.ownerId],
		references: [user.id]
	}),
	accountMembers: many(accountMembers),
}));

export const userRelations = relations(user, ({many}) => ({
	accounts_ownerId: many(accounts),
	sessions: many(session),
	accounts_userId: many(account),
	accountMembers: many(accountMembers),
	subscriptions: many(subscription),
}));

export const sessionRelations = relations(session, ({one}) => ({
	user: one(user, {
		fields: [session.userId],
		references: [user.id]
	}),
}));

export const accountRelations = relations(account, ({one}) => ({
	user: one(user, {
		fields: [account.userId],
		references: [user.id]
	}),
}));

export const accountMembersRelations = relations(accountMembers, ({one}) => ({
	user: one(user, {
		fields: [accountMembers.userId],
		references: [user.id]
	}),
	account: one(accounts, {
		fields: [accountMembers.accountId],
		references: [accounts.id]
	}),
}));

export const subscriptionRelations = relations(subscription, ({one}) => ({
	user: one(user, {
		fields: [subscription.userId],
		references: [user.id]
	}),
}));

export const ozzaAccountsRelations = relations(ozzaAccounts, ({one, many}) => ({
	plan: one(plans, {
		fields: [ozzaAccounts.planId],
		references: [plans.planId]
	}),
	clientInvitations: many(clientInvitations),
	domains: many(domains),
	billingEvents: many(billingEvents),
	ozzaAccountMembers: many(ozzaAccountMembers),
	accountFeatures: many(accountFeatures),
}));

export const plansRelations = relations(plans, ({many}) => ({
	ozzaAccounts: many(ozzaAccounts),
}));

export const clientInvitationsRelations = relations(clientInvitations, ({one}) => ({
	ozzaAccount: one(ozzaAccounts, {
		fields: [clientInvitations.accountId],
		references: [ozzaAccounts.id]
	}),
}));

export const domainsRelations = relations(domains, ({one}) => ({
	ozzaAccount: one(ozzaAccounts, {
		fields: [domains.accountId],
		references: [ozzaAccounts.id]
	}),
}));

export const billingEventsRelations = relations(billingEvents, ({one}) => ({
	ozzaAccount: one(ozzaAccounts, {
		fields: [billingEvents.accountId],
		references: [ozzaAccounts.id]
	}),
}));

export const ozzaAccountMembersRelations = relations(ozzaAccountMembers, ({one}) => ({
	ozzaAccount: one(ozzaAccounts, {
		fields: [ozzaAccountMembers.accountId],
		references: [ozzaAccounts.id]
	}),
}));

export const accountFeaturesRelations = relations(accountFeatures, ({one}) => ({
	ozzaAccount: one(ozzaAccounts, {
		fields: [accountFeatures.accountId],
		references: [ozzaAccounts.id]
	}),
	feature: one(features, {
		fields: [accountFeatures.featureKey],
		references: [features.featureKey]
	}),
}));

export const featuresRelations = relations(features, ({many}) => ({
	accountFeatures: many(accountFeatures),
}));