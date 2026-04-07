use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_2022::{transfer_checked, TransferChecked, Token2022},
    token_interface::{Mint, TokenAccount},
};

declare_id!("C9FUrbEatQASUhbvvAA1XRHVeMFxTgX3QvVFNt5cKYnn");

// ─── Constants ────────────────────────────────────────────────────────────────
pub const MAX_PROPERTY_ID_LEN: usize = 32;
pub const MAX_NAME_LEN: usize = 64;
pub const MAX_EDS_HASH_LEN: usize = 64;
pub const MAX_INVESTORS: usize = 100;

#[program]
pub mod rwa_tokenizer {
    use super::*;

    /// Registers a new real estate property on-chain.
    /// The EDS hash (Kazakhstan ЭЦП НУЦ РК signature) is stored immutably.
    pub fn initialize_property(
        ctx: Context<InitializeProperty>,
        property_id: String,
        name: String,
        valuation_usd: u64,
        total_shares: u64,
        eds_hash: String,
    ) -> Result<()> {
        require!(property_id.len() <= MAX_PROPERTY_ID_LEN, RwaError::StringTooLong);
        require!(name.len() <= MAX_NAME_LEN, RwaError::StringTooLong);
        require!(eds_hash.len() <= MAX_EDS_HASH_LEN, RwaError::StringTooLong);
        require!(total_shares > 0, RwaError::InvalidShares);

        let state = &mut ctx.accounts.property_state;
        state.owner = ctx.accounts.owner.key();
        state.property_id = property_id;
        state.name = name;
        state.valuation_usd = valuation_usd;
        state.total_shares = total_shares;
        state.sold_shares = 0;
        state.eds_hash = eds_hash;
        state.mint = ctx.accounts.mint.key();
        state.bump = ctx.bumps.property_state;

        emit!(PropertyInitialized {
            property_id: state.property_id.clone(),
            owner: state.owner,
            valuation_usd,
            total_shares,
            eds_hash: state.eds_hash.clone(),
        });

        Ok(())
    }

    /// Records an investor's share purchase.
    /// Transfers SPL tokens from issuer's ATA to investor's ATA.
    pub fn buy_shares(
        ctx: Context<BuyShares>,
        property_id: String,
        share_amount: u64,
    ) -> Result<()> {
        require!(share_amount > 0, RwaError::InvalidShares);

        let state = &mut ctx.accounts.property_state;
        let available = state.total_shares.saturating_sub(state.sold_shares);
        require!(share_amount <= available, RwaError::InsufficientSupply);

        // Transfer Token-2022 tokens: issuer_ata → investor_ata
        let decimals = ctx.accounts.mint.decimals;
        transfer_checked(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                TransferChecked {
                    from: ctx.accounts.issuer_ata.to_account_info(),
                    mint: ctx.accounts.mint.to_account_info(),
                    to: ctx.accounts.investor_ata.to_account_info(),
                    authority: ctx.accounts.issuer.to_account_info(),
                },
            ),
            share_amount,
            decimals,
        )?;

        // Update on-chain state
        state.sold_shares = state.sold_shares.saturating_add(share_amount);

        let position = &mut ctx.accounts.investor_position;
        position.investor = ctx.accounts.investor.key();
        position.property_id = property_id.clone();
        position.shares_owned = position.shares_owned.saturating_add(share_amount);
        position.bump = ctx.bumps.investor_position;

        let price_per_share_usd = state.valuation_usd / state.total_shares;
        let usd_value = price_per_share_usd.saturating_mul(share_amount);

        emit!(SharesPurchased {
            property_id,
            investor: ctx.accounts.investor.key(),
            share_amount,
            usd_value,
        });

        Ok(())
    }

    /// Distributes USDC yield proportionally to all investors.
    /// Caller provides the yield pool ATA and each investor's USDC ATA.
    /// yield_amount_usdc is in USDC atomic units (6 decimals, so 1 USDC = 1_000_000).
    pub fn distribute_yield(
        ctx: Context<DistributeYield>,
        _property_id: String,
        yield_amount_usdc: u64,
    ) -> Result<()> {
        require!(yield_amount_usdc > 0, RwaError::ZeroYield);

        let state = &ctx.accounts.property_state;
        let position = &ctx.accounts.investor_position;

        require!(position.shares_owned > 0, RwaError::NoShares);
        require!(state.sold_shares > 0, RwaError::NoShares);

        // Calculate proportional yield: investor_shares / sold_shares * pool
        let numerator = (yield_amount_usdc as u128)
            .saturating_mul(position.shares_owned as u128);
        let investor_yield = (numerator / state.sold_shares as u128) as u64;

        require!(investor_yield > 0, RwaError::ZeroYield);

        // Transfer USDC from yield pool → investor USDC ATA
        let decimals = ctx.accounts.usdc_mint.decimals;
        transfer_checked(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                TransferChecked {
                    from: ctx.accounts.yield_pool_ata.to_account_info(),
                    mint: ctx.accounts.usdc_mint.to_account_info(),
                    to: ctx.accounts.investor_usdc_ata.to_account_info(),
                    authority: ctx.accounts.yield_authority.to_account_info(),
                },
            ),
            investor_yield,
            decimals,
        )?;

        emit!(YieldDistributed {
            property_id: state.property_id.clone(),
            investor: position.investor,
            usdc_amount: investor_yield,
            shares_owned: position.shares_owned,
        });

        Ok(())
    }
}

// ─── Account Contexts ─────────────────────────────────────────────────────────

#[derive(Accounts)]
#[instruction(property_id: String)]
pub struct InitializeProperty<'info> {
    #[account(
        init,
        payer = owner,
        space = PropertyState::LEN,
        seeds = [b"property", property_id.as_bytes()],
        bump,
    )]
    pub property_state: Account<'info, PropertyState>,

    /// The Token-2022 mint representing fractional shares
    pub mint: InterfaceAccount<'info, Mint>,

    #[account(mut)]
    pub owner: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(property_id: String)]
pub struct BuyShares<'info> {
    #[account(
        mut,
        seeds = [b"property", property_id.as_bytes()],
        bump = property_state.bump,
    )]
    pub property_state: Account<'info, PropertyState>,

    #[account(
        init_if_needed,
        payer = investor,
        space = InvestorPosition::LEN,
        seeds = [b"investor", property_id.as_bytes(), investor.key().as_ref()],
        bump,
    )]
    pub investor_position: Account<'info, InvestorPosition>,

    /// Token-2022 mint for the property
    #[account(mut)]
    pub mint: InterfaceAccount<'info, Mint>,

    /// Issuer's token account (source of shares)
    #[account(mut)]
    pub issuer_ata: InterfaceAccount<'info, TokenAccount>,

    /// Investor's token account (destination)
    #[account(
        init_if_needed,
        payer = investor,
        associated_token::mint = mint,
        associated_token::authority = investor,
        associated_token::token_program = token_program,
    )]
    pub investor_ata: InterfaceAccount<'info, TokenAccount>,

    /// Property owner / issuer must sign to approve share release
    pub issuer: Signer<'info>,

    #[account(mut)]
    pub investor: Signer<'info>,

    pub token_program: Program<'info, Token2022>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(property_id: String)]
pub struct DistributeYield<'info> {
    #[account(
        seeds = [b"property", property_id.as_bytes()],
        bump = property_state.bump,
    )]
    pub property_state: Account<'info, PropertyState>,

    #[account(
        seeds = [b"investor", property_id.as_bytes(), investor_position.investor.as_ref()],
        bump = investor_position.bump,
    )]
    pub investor_position: Account<'info, InvestorPosition>,

    /// USDC mint (standard SPL token)
    pub usdc_mint: InterfaceAccount<'info, Mint>,

    /// Yield pool token account (holds USDC to distribute)
    #[account(mut)]
    pub yield_pool_ata: InterfaceAccount<'info, TokenAccount>,

    /// Investor's USDC receiving account
    #[account(
        init_if_needed,
        payer = yield_authority,
        associated_token::mint = usdc_mint,
        associated_token::authority = investor_position,
        associated_token::token_program = token_program,
    )]
    pub investor_usdc_ata: InterfaceAccount<'info, TokenAccount>,

    /// Authority that controls the yield pool (signs distributions)
    #[account(mut)]
    pub yield_authority: Signer<'info>,

    pub token_program: Program<'info, Token2022>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

// ─── State Accounts ───────────────────────────────────────────────────────────

#[account]
pub struct PropertyState {
    pub owner: Pubkey,                        // 32
    pub property_id: String,                  // 4 + MAX_PROPERTY_ID_LEN
    pub name: String,                         // 4 + MAX_NAME_LEN
    pub valuation_usd: u64,                   // 8
    pub total_shares: u64,                    // 8
    pub sold_shares: u64,                     // 8
    pub eds_hash: String,                     // 4 + MAX_EDS_HASH_LEN
    pub mint: Pubkey,                         // 32
    pub bump: u8,                             // 1
}

impl PropertyState {
    pub const LEN: usize = 8  // discriminator
        + 32                   // owner
        + 4 + MAX_PROPERTY_ID_LEN
        + 4 + MAX_NAME_LEN
        + 8                    // valuation_usd
        + 8                    // total_shares
        + 8                    // sold_shares
        + 4 + MAX_EDS_HASH_LEN
        + 32                   // mint
        + 1;                   // bump
}

#[account]
pub struct InvestorPosition {
    pub investor: Pubkey,         // 32
    pub property_id: String,      // 4 + MAX_PROPERTY_ID_LEN
    pub shares_owned: u64,        // 8
    pub bump: u8,                 // 1
}

impl InvestorPosition {
    pub const LEN: usize = 8  // discriminator
        + 32                   // investor
        + 4 + MAX_PROPERTY_ID_LEN
        + 8                    // shares_owned
        + 1;                   // bump
}

// ─── Events ───────────────────────────────────────────────────────────────────

#[event]
pub struct PropertyInitialized {
    pub property_id: String,
    pub owner: Pubkey,
    pub valuation_usd: u64,
    pub total_shares: u64,
    pub eds_hash: String,
}

#[event]
pub struct SharesPurchased {
    pub property_id: String,
    pub investor: Pubkey,
    pub share_amount: u64,
    pub usd_value: u64,
}

#[event]
pub struct YieldDistributed {
    pub property_id: String,
    pub investor: Pubkey,
    pub usdc_amount: u64,
    pub shares_owned: u64,
}

// ─── Errors ───────────────────────────────────────────────────────────────────

#[error_code]
pub enum RwaError {
    #[msg("String field exceeds maximum length")]
    StringTooLong,
    #[msg("Share amount must be greater than zero")]
    InvalidShares,
    #[msg("Insufficient share supply available")]
    InsufficientSupply,
    #[msg("Investor has no shares in this property")]
    NoShares,
    #[msg("Yield amount must be greater than zero")]
    ZeroYield,
}
