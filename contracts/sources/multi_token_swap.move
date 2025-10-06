module sui_naira_swap::multi_token_swap {
    use sui::object::{Self, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::event;
    use std::string::{Self, String};
    use std::type_name;

    // ===== CONSTANTS =====
    #[error]
    const ESUNAIRA_SWAP: u8 = 0;
    #[error]
    const EINSUFFICIENT_BALANCE: u8 = 1;
    #[error]
    const EINVALID_AMOUNT: u8 = 2;
    #[error]
    const ETRANSACTION_NOT_FOUND: u8 = 3;
    #[error]
    const ETRANSACTION_ALREADY_PROCESSED: u8 = 4;
    #[error]
    const EUNAUTHORIZED: u8 = 5;
    #[error]
    const ESWAP_PAUSED: u8 = 6;
    #[error]
    const ETREASURY_RECEIPT_FAILED: u8 = 7;
    #[error]
    const EUNSUPPORTED_TOKEN: u8 = 8;
    #[error]
    const EINVALID_TOKEN_TYPE: u8 = 9;

    // ===== STRUCTS =====
    
    /// Main multi-token swap contract object
    public struct MultiTokenSwapContract has key {
        id: UID,
        /// Admin address for contract management
        admin: address,
        /// Contract pause state
        paused: bool,
        /// Treasury wallet for holding tokens
        treasury: address,
        /// Supported token types
        supported_tokens: vector<String>,
        /// Exchange rates for each token (in Naira per token)
        exchange_rates: vector<u64>,
        /// Minimum swap amounts for each token
        min_swap_amounts: vector<u64>,
        /// Maximum swap amounts for each token
        max_swap_amounts: vector<u64>,
        /// Transaction counter
        transaction_counter: u64,
    }

    /// Transaction record for tracking multi-token swaps
    public struct MultiTokenSwapTransaction has key, store {
        id: UID,
        /// Transaction ID
        tx_id: u64,
        /// User wallet address
        user_address: address,
        /// Token type: "SUI", "USDC", "USDT"
        token_type: String,
        /// Swap type: "ON_RAMP" or "OFF_RAMP"
        swap_type: String,
        /// Amount in tokens (smallest unit)
        token_amount: u64,
        /// Amount in Naira
        naira_amount: u64,
        /// Exchange rate used
        exchange_rate: u64,
        /// Transaction status: "PENDING", "CONFIRMED", "FAILED", "COMPLETED"
        status: String,
        /// Timestamp when transaction was created
        created_at: u64,
        /// Timestamp when transaction was confirmed
        confirmed_at: u64,
        /// Payment reference (for Naira payments)
        payment_reference: String,
        /// Bank account details (for OFF_RAMP - where to send money)
        bank_account: String,
        /// Bank name (for OFF_RAMP - where to send money)
        bank_name: String,
        /// Payment source account number (for ON_RAMP - where money comes from)
        payment_source_account: String,
        /// Payment source bank code (for ON_RAMP - where money comes from)
        payment_source_bank: String,
        /// Payment source account name (for ON_RAMP - where money comes from)
        payment_source_name: String,
    }

    /// Multi-token treasury object
    public struct MultiTokenTreasury has key {
        id: UID,
        /// Treasury wallet address
        treasury_address: address,
        /// Available balances for each token type
        token_balances: vector<u64>,
        /// Total deposited for each token type
        total_deposited: vector<u64>,
        /// Total withdrawn for each token type
        total_withdrawn: vector<u64>,
        /// Supported token types
        token_types: vector<String>,
    }

    /// Admin capabilities for contract management
    public struct AdminCap has key {
        id: UID,
        admin_address: address,
    }

    // ===== EVENTS =====
    
    /// Event emitted when a swap transaction is created
    public struct SwapTransactionCreated has copy, drop {
        tx_id: u64,
        user_address: address,
        token_type: String,
        swap_type: String,
        token_amount: u64,
        naira_amount: u64,
        exchange_rate: u64,
    }

    /// Event emitted when a swap transaction is confirmed
    public struct SwapTransactionConfirmed has copy, drop {
        tx_id: u64,
        token_type: String,
        swap_type: String,
        status: String,
    }

    /// Event emitted when tokens are deposited to treasury
    public struct TokensDeposited has copy, drop {
        token_type: String,
        amount: u64,
        treasury_balance: u64,
    }

    /// Event emitted when tokens are withdrawn from treasury
    public struct TokensWithdrawn has copy, drop {
        token_type: String,
        amount: u64,
        treasury_balance: u64,
    }

    /// Event emitted when exchange rates are updated
    public struct ExchangeRatesUpdated has copy, drop {
        token_types: vector<String>,
        new_rates: vector<u64>,
    }

    // ===== INITIALIZATION =====
    
    /// Initialize the multi-token swap contract
    fun init(ctx: &mut TxContext) {
        let admin = tx_context::sender(ctx);
        
        // Initialize supported tokens: SUI, USDC, USDT
        let supported_tokens = vector[
            string::utf8(b"SUI"),
            string::utf8(b"USDC"),
            string::utf8(b"USDT")
        ];
        
        // Initialize exchange rates (in Naira per token)
        // SUI: ~5853 NGN, USDC: ~1649 NGN, USDT: ~1650 NGN
        let exchange_rates = vector[
            5853000000, // SUI: 5853 NGN (with 6 decimal precision)
            1649000000, // USDC: 1649 NGN (with 6 decimal precision)
            1650000000  // USDT: 1650 NGN (with 6 decimal precision)
        ];
        
        // Initialize min/max amounts (in smallest token units)
        let min_swap_amounts = vector[
            1000000000,  // SUI: 1 SUI minimum (9 decimals)
            1000000,     // USDC: 1 USDC minimum (6 decimals)
            1000000      // USDT: 1 USDT minimum (6 decimals)
        ];
        
        let max_swap_amounts = vector[
            100000000000000, // SUI: 100,000 SUI maximum
            100000000000,    // USDC: 100,000 USDC maximum
            100000000000     // USDT: 100,000 USDT maximum
        ];
        
        let contract = MultiTokenSwapContract {
            id: object::new(ctx),
            admin,
            paused: false,
            treasury: admin, // Initially admin is treasury
            supported_tokens,
            exchange_rates,
            min_swap_amounts,
            max_swap_amounts,
            transaction_counter: 0,
        };
        
        // Create admin capability
        let admin_cap = AdminCap {
            id: object::new(ctx),
            admin_address: admin,
        };
        
        // Create multi-token treasury
        let treasury = MultiTokenTreasury {
            id: object::new(ctx),
            treasury_address: admin,
            token_balances: vector[0, 0, 0],
            total_deposited: vector[0, 0, 0],
            total_withdrawn: vector[0, 0, 0],
            token_types: vector[
                string::utf8(b"SUI"),
                string::utf8(b"USDC"),
                string::utf8(b"USDT")
            ],
        };
        
        transfer::share_object(contract);
        transfer::transfer(admin_cap, admin);
        transfer::share_object(treasury);
    }

    // ===== HELPER FUNCTIONS =====
    
    /// Get token index by type
    fun get_token_index(token_type: &String): u64 {
        if (token_type == &string::utf8(b"SUI")) {
            0
        } else if (token_type == &string::utf8(b"USDC")) {
            1
        } else if (token_type == &string::utf8(b"USDT")) {
            2
        } else {
            abort EUNSUPPORTED_TOKEN
        }
    }
    
    /// Validate token amount against min/max limits
    fun validate_token_amount(contract: &MultiTokenSwapContract, token_type: &String, amount: u64): bool {
        let token_index = get_token_index(token_type);
        let min_amount = *vector::borrow(&contract.min_swap_amounts, token_index);
        let max_amount = *vector::borrow(&contract.max_swap_amounts, token_index);
        
        amount >= min_amount && amount <= max_amount
    }
    
    /// Calculate Naira amount from token amount
    fun calculate_naira_amount(contract: &MultiTokenSwapContract, token_type: &String, token_amount: u64): u64 {
        let token_index = get_token_index(token_type);
        let exchange_rate = *vector::borrow(&contract.exchange_rates, token_index);
        
        // Calculate: (token_amount * exchange_rate) / 10^6 (for precision)
        (token_amount * exchange_rate) / 1000000
    }

    // ===== ADMIN FUNCTIONS =====
    
    /// Update exchange rates (admin only)
    public fun update_exchange_rates(
        contract: &mut MultiTokenSwapContract,
        admin_cap: &AdminCap,
        new_rates: vector<u64>,
        ctx: &mut TxContext
    ) {
        assert!(admin_cap.admin_address == tx_context::sender(ctx), EUNAUTHORIZED);
        assert!(vector::length(&new_rates) == vector::length(&contract.supported_tokens), EINVALID_TOKEN_TYPE);
        
        contract.exchange_rates = new_rates;
        
        event::emit(ExchangeRatesUpdated {
            token_types: contract.supported_tokens,
            new_rates: contract.exchange_rates,
        });
    }
    
    /// Update treasury address (admin only)
    public fun update_treasury_address(
        contract: &mut MultiTokenSwapContract,
        admin_cap: &AdminCap,
        new_treasury: address,
        ctx: &mut TxContext
    ) {
        assert!(admin_cap.admin_address == tx_context::sender(ctx), EUNAUTHORIZED);
        contract.treasury = new_treasury;
    }
    
    /// Pause/unpause contract (admin only)
    public fun set_pause_state(
        contract: &mut MultiTokenSwapContract,
        admin_cap: &AdminCap,
        paused: bool,
        ctx: &mut TxContext
    ) {
        assert!(admin_cap.admin_address == tx_context::sender(ctx), EUNAUTHORIZED);
        contract.paused = paused;
    }

    // ===== TREASURY FUNCTIONS =====
    
    /// Deposit tokens to treasury (generic function for any token type)
    public fun deposit_tokens<T>(
        treasury: &mut MultiTokenTreasury,
        contract: &MultiTokenSwapContract,
        payment: Coin<T>,
        token_type: String,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == contract.treasury, EUNAUTHORIZED);
        
        let token_index = get_token_index(&token_type);
        let amount = coin::value(&payment);
        
        // Update treasury balances
        let balance = vector::borrow_mut(&mut treasury.token_balances, token_index);
        let total_deposited = vector::borrow_mut(&mut treasury.total_deposited, token_index);
        
        *balance = *balance + amount;
        *total_deposited = *total_deposited + amount;
        
        // Transfer coins to treasury
        transfer::public_transfer(payment, treasury.treasury_address);
        
        event::emit(TokensDeposited {
            token_type,
            amount,
            treasury_balance: *balance,
        });
    }
    
    /// Withdraw tokens from treasury (generic function for any token type)
    public fun withdraw_tokens<T>(
        treasury: &mut MultiTokenTreasury,
        contract: &MultiTokenSwapContract,
        amount: u64,
        token_type: String,
        ctx: &mut TxContext
    ): Coin<T> {
        assert!(tx_context::sender(ctx) == contract.treasury, EUNAUTHORIZED);
        
        let token_index = get_token_index(&token_type);
        let balance = vector::borrow_mut(&mut treasury.token_balances, token_index);
        let total_withdrawn = vector::borrow_mut(&mut treasury.total_withdrawn, token_index);
        
        assert!(*balance >= amount, EINSUFFICIENT_BALANCE);
        
        *balance = *balance - amount;
        *total_withdrawn = *total_withdrawn + amount;
        
        // Note: In a real implementation, you would need to handle the actual coin transfer
        // This is a simplified version for demonstration
        
        event::emit(TokensWithdrawn {
            token_type,
            amount,
            treasury_balance: *balance,
        });
        
        // Return empty coin (in real implementation, this would be actual coins)
        coin::zero<T>(ctx)
    }

    // ===== SWAP FUNCTIONS =====
    
    /// Create OFF_RAMP transaction (Token → Naira)
    public fun create_off_ramp_transaction<T>(
        contract: &mut MultiTokenSwapContract,
        treasury: &mut MultiTokenTreasury,
        payment: Coin<T>,
        token_type: String,
        bank_account: String,
        bank_name: String,
        ctx: &mut TxContext
    ): MultiTokenSwapTransaction {
        assert!(!contract.paused, ESWAP_PAUSED);
        
        let token_amount = coin::value(&payment);
        assert!(validate_token_amount(contract, &token_type, token_amount), EINVALID_AMOUNT);
        
        // Calculate Naira amount
        let naira_amount = calculate_naira_amount(contract, &token_type, token_amount);
        
        // Increment transaction counter
        contract.transaction_counter = contract.transaction_counter + 1;
        let tx_id = contract.transaction_counter;
        
        // Create transaction record
        let transaction = MultiTokenSwapTransaction {
            id: object::new(ctx),
            tx_id,
            user_address: tx_context::sender(ctx),
            token_type,
            swap_type: string::utf8(b"OFF_RAMP"),
            token_amount,
            naira_amount,
            exchange_rate: *vector::borrow(&contract.exchange_rates, get_token_index(&token_type)),
            status: string::utf8(b"PENDING"),
            created_at: tx_context::epoch_timestamp_ms(ctx),
            confirmed_at: 0,
            payment_reference: string::utf8(b""),
            bank_account,
            bank_name,
            payment_source_account: string::utf8(b""),
            payment_source_bank: string::utf8(b""),
            payment_source_name: string::utf8(b""),
        };
        
        // Deposit tokens to treasury
        deposit_tokens(treasury, contract, payment, transaction.token_type, ctx);
        
        event::emit(SwapTransactionCreated {
            tx_id,
            user_address: tx_context::sender(ctx),
            token_type: transaction.token_type,
            swap_type: transaction.swap_type,
            token_amount,
            naira_amount,
            exchange_rate: transaction.exchange_rate,
        });
        
        transaction
    }
    
    /// Create ON_RAMP transaction (Naira → Token)
    public fun create_on_ramp_transaction(
        contract: &mut MultiTokenSwapContract,
        token_type: String,
        naira_amount: u64,
        payment_reference: String,
        payment_source_account: String,
        payment_source_bank: String,
        payment_source_name: String,
        ctx: &mut TxContext
    ): MultiTokenSwapTransaction {
        assert!(!contract.paused, ESWAP_PAUSED);
        
        // Calculate token amount from Naira
        let token_index = get_token_index(&token_type);
        let exchange_rate = *vector::borrow(&contract.exchange_rates, token_index);
        let token_amount = (naira_amount * 1000000) / exchange_rate; // Convert back to token amount
        
        assert!(validate_token_amount(contract, &token_type, token_amount), EINVALID_AMOUNT);
        
        // Increment transaction counter
        contract.transaction_counter = contract.transaction_counter + 1;
        let tx_id = contract.transaction_counter;
        
        // Create transaction record
        let transaction = MultiTokenSwapTransaction {
            id: object::new(ctx),
            tx_id,
            user_address: tx_context::sender(ctx),
            token_type,
            swap_type: string::utf8(b"ON_RAMP"),
            token_amount,
            naira_amount,
            exchange_rate,
            status: string::utf8(b"PENDING"),
            created_at: tx_context::epoch_timestamp_ms(ctx),
            confirmed_at: 0,
            payment_reference,
            bank_account: string::utf8(b""),
            bank_name: string::utf8(b""),
            payment_source_account,
            payment_source_bank,
            payment_source_name,
        };
        
        event::emit(SwapTransactionCreated {
            tx_id,
            user_address: tx_context::sender(ctx),
            token_type: transaction.token_type,
            swap_type: transaction.swap_type,
            token_amount,
            naira_amount,
            exchange_rate: transaction.exchange_rate,
        });
        
        transaction
    }
    
    /// Confirm transaction (admin only)
    public fun confirm_transaction(
        contract: &mut MultiTokenSwapContract,
        admin_cap: &AdminCap,
        transaction: &mut MultiTokenSwapTransaction,
        status: String,
        ctx: &mut TxContext
    ) {
        assert!(admin_cap.admin_address == tx_context::sender(ctx), EUNAUTHORIZED);
        
        transaction.status = status;
        transaction.confirmed_at = tx_context::epoch_timestamp_ms(ctx);
        
        event::emit(SwapTransactionConfirmed {
            tx_id: transaction.tx_id,
            token_type: transaction.token_type,
            swap_type: transaction.swap_type,
            status: transaction.status,
        });
    }

    // ===== VIEW FUNCTIONS =====
    
    /// Get contract information
    public fun get_contract_info(contract: &MultiTokenSwapContract): (address, bool, address, vector<String>, vector<u64>) {
        (
            contract.admin,
            contract.paused,
            contract.treasury,
            contract.supported_tokens,
            contract.exchange_rates
        )
    }
    
    /// Get treasury information
    public fun get_treasury_info(treasury: &MultiTokenTreasury): (address, vector<u64>, vector<u64>, vector<u64>) {
        (
            treasury.treasury_address,
            treasury.token_balances,
            treasury.total_deposited,
            treasury.total_withdrawn
        )
    }
    
    /// Get transaction information
    public fun get_transaction_info(transaction: &MultiTokenSwapTransaction): (u64, address, String, String, u64, u64, String) {
        (
            transaction.tx_id,
            transaction.user_address,
            transaction.token_type,
            transaction.swap_type,
            transaction.token_amount,
            transaction.naira_amount,
            transaction.status
        )
    }
    
    /// Check if token is supported
    public fun is_token_supported(contract: &MultiTokenSwapContract, token_type: &String): bool {
        let len = vector::length(&contract.supported_tokens);
        let mut i = 0;
        while (i < len) {
            if (vector::borrow(&contract.supported_tokens, i) == token_type) {
                return true
            };
            i = i + 1;
        };
        false
    }
    
    /// Get exchange rate for a token
    public fun get_exchange_rate(contract: &MultiTokenSwapContract, token_type: &String): u64 {
        let token_index = get_token_index(token_type);
        *vector::borrow(&contract.exchange_rates, token_index)
    }
    
    /// Get min/max amounts for a token
    public fun get_amount_limits(contract: &MultiTokenSwapContract, token_type: &String): (u64, u64) {
        let token_index = get_token_index(token_type);
        (
            *vector::borrow(&contract.min_swap_amounts, token_index),
            *vector::borrow(&contract.max_swap_amounts, token_index)
        )
    }
}
