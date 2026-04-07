use anchor_lang::{
    prelude::*,
    system_program::{create_account, CreateAccount},
};
use spl_tlv_account_resolution::{
    account::ExtraAccountMeta, seeds::Seed, state::ExtraAccountMetaList,
};
use spl_transfer_hook_interface::instruction::ExecuteInstruction;

declare_id!("DueqM2eEUpHR7SFm957Xd8kAmykXKUqjy1sLoXHVwv3p");

pub const MAX_WHITELIST_SIZE: usize = 100;

#[program]
pub mod transfer_hook {
    use super::*;

    /// Called once per mint to set up the extra accounts the hook needs.
    /// Stores the KYC whitelist PDA as a required extra account.
    pub fn initialize_extra_account_metas(
        ctx: Context<InitializeExtraAccountMetas>,
    ) -> Result<()> {
        // The hook requires one extra account: the KycWhitelist PDA
        let extra_metas = [ExtraAccountMeta::new_with_seeds(
            &[
                Seed::Literal { bytes: b"kyc-whitelist".to_vec() },
                Seed::AccountKey { index: 0 }, // index 0 = source token account
            ],
            false, // is_signer
            false, // is_writable
        )?];

        let account_size = ExtraAccountMetaList::size_of(extra_metas.len())? as u64;
        let lamports = Rent::get()?.minimum_balance(account_size as usize);
        let mint = ctx.accounts.mint.key();
        let signer_seeds: &[&[&[u8]]] = &[&[
            b"extra-account-metas",
            mint.as_ref(),
            &[ctx.bumps.extra_account_meta_list],
        ]];

        create_account(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                CreateAccount {
                    from: ctx.accounts.payer.to_account_info(),
                    to: ctx.accounts.extra_account_meta_list.to_account_info(),
                },
            )
            .with_signer(signer_seeds),
            lamports,
            account_size,
            ctx.program_id,
        )?;

        ExtraAccountMetaList::init::<ExecuteInstruction>(
            &mut ctx.accounts.extra_account_meta_list.try_borrow_mut_data()?,
            &extra_metas,
        )?;

        Ok(())
    }

    /// Called by Token-2022 on every token transfer.
    /// Verifies both sender and recipient are KYC-whitelisted.
    pub fn execute(ctx: Context<Execute>, _amount: u64) -> Result<()> {
        let whitelist = &ctx.accounts.kyc_whitelist;

        let source_owner = ctx.accounts.source_token.owner;
        let dest_owner = ctx.accounts.destination_token.owner;

        require!(
            whitelist.approved.contains(&source_owner),
            HookError::SenderNotWhitelisted
        );
        require!(
            whitelist.approved.contains(&dest_owner),
            HookError::ReceiverNotWhitelisted
        );

        Ok(())
    }

    /// Admin instruction: approve a wallet address for KYC.
    pub fn add_to_whitelist(ctx: Context<AddToWhitelist>, wallet: Pubkey) -> Result<()> {
        let whitelist = &mut ctx.accounts.kyc_whitelist;
        require!(
            !whitelist.approved.contains(&wallet),
            HookError::AlreadyWhitelisted
        );
        require!(
            whitelist.approved.len() < MAX_WHITELIST_SIZE,
            HookError::WhitelistFull
        );
        whitelist.approved.push(wallet);
        emit!(WalletWhitelisted { wallet });
        Ok(())
    }

    /// Admin instruction: remove a wallet from KYC whitelist.
    pub fn remove_from_whitelist(ctx: Context<AddToWhitelist>, wallet: Pubkey) -> Result<()> {
        let whitelist = &mut ctx.accounts.kyc_whitelist;
        whitelist.approved.retain(|&w| w != wallet);
        emit!(WalletRemovedFromWhitelist { wallet });
        Ok(())
    }

    /// Initialize the global KYC whitelist for a given mint.
    pub fn initialize_kyc_whitelist(ctx: Context<InitializeKycWhitelist>) -> Result<()> {
        let whitelist = &mut ctx.accounts.kyc_whitelist;
        whitelist.admin = ctx.accounts.admin.key();
        whitelist.approved = Vec::new();
        whitelist.bump = ctx.bumps.kyc_whitelist;
        Ok(())
    }
}

// ─── Account Contexts ─────────────────────────────────────────────────────────

#[derive(Accounts)]
pub struct InitializeExtraAccountMetas<'info> {
    #[account(
        mut,
        seeds = [b"extra-account-metas", mint.key().as_ref()],
        bump,
    )]
    /// CHECK: Created manually via CPI to system program
    pub extra_account_meta_list: AccountInfo<'info>,

    pub mint: InterfaceAccount<'info, anchor_spl::token_interface::Mint>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub system_program: Program<'info, System>,
}

/// Token-2022 calls this on every transfer with 4 base accounts +
/// any extra accounts registered in `extra_account_meta_list`.
#[derive(Accounts)]
pub struct Execute<'info> {
    /// Source token account
    pub source_token: InterfaceAccount<'info, anchor_spl::token_interface::TokenAccount>,

    /// Token mint
    pub mint: InterfaceAccount<'info, anchor_spl::token_interface::Mint>,

    /// Destination token account
    pub destination_token: InterfaceAccount<'info, anchor_spl::token_interface::TokenAccount>,

    /// Owner/delegate of the source account
    /// CHECK: Passed by Token-2022 runtime
    pub authority: AccountInfo<'info>,

    /// Extra accounts list (registered in initialize_extra_account_metas)
    /// CHECK: Validated by spl-transfer-hook-interface
    #[account(
        seeds = [b"extra-account-metas", mint.key().as_ref()],
        bump,
    )]
    pub extra_account_meta_list: AccountInfo<'info>,

    /// KYC whitelist PDA
    #[account(
        seeds = [b"kyc-whitelist", mint.key().as_ref()],
        bump = kyc_whitelist.bump,
    )]
    pub kyc_whitelist: Account<'info, KycWhitelist>,
}

#[derive(Accounts)]
pub struct InitializeKycWhitelist<'info> {
    #[account(
        init,
        payer = admin,
        space = KycWhitelist::LEN,
        seeds = [b"kyc-whitelist", mint.key().as_ref()],
        bump,
    )]
    pub kyc_whitelist: Account<'info, KycWhitelist>,

    pub mint: InterfaceAccount<'info, anchor_spl::token_interface::Mint>,

    #[account(mut)]
    pub admin: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct AddToWhitelist<'info> {
    #[account(
        mut,
        has_one = admin,
        seeds = [b"kyc-whitelist", mint.key().as_ref()],
        bump = kyc_whitelist.bump,
    )]
    pub kyc_whitelist: Account<'info, KycWhitelist>,

    pub mint: InterfaceAccount<'info, anchor_spl::token_interface::Mint>,

    pub admin: Signer<'info>,
}

// ─── State ────────────────────────────────────────────────────────────────────

#[account]
pub struct KycWhitelist {
    pub admin: Pubkey,              // 32
    pub approved: Vec<Pubkey>,      // 4 + MAX_WHITELIST_SIZE * 32
    pub bump: u8,                   // 1
}

impl KycWhitelist {
    pub const LEN: usize = 8          // discriminator
        + 32                           // admin
        + 4 + (MAX_WHITELIST_SIZE * 32) // Vec<Pubkey>
        + 1;                           // bump
}

// ─── Events ───────────────────────────────────────────────────────────────────

#[event]
pub struct WalletWhitelisted {
    pub wallet: Pubkey,
}

#[event]
pub struct WalletRemovedFromWhitelist {
    pub wallet: Pubkey,
}

// ─── Errors ───────────────────────────────────────────────────────────────────

#[error_code]
pub enum HookError {
    #[msg("Sender wallet is not KYC whitelisted")]
    SenderNotWhitelisted,
    #[msg("Receiver wallet is not KYC whitelisted")]
    ReceiverNotWhitelisted,
    #[msg("Wallet is already in the whitelist")]
    AlreadyWhitelisted,
    #[msg("KYC whitelist is full (max 100 addresses)")]
    WhitelistFull,
}
