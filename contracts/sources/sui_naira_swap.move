module sui_naira_swap::swap {
    use sui::object::{Self, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::event;
    use std::string::{Self, String};

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

    // ===== STRUCTS =====
    
    /// Main swap contract object
    public struct SwapContract has key {
        id: UID,
        /// Admin address for contract management
        admin: address,
        /// Contract pause state
        paused: bool,
        /// Treasury wallet for holding SUI tokens
        treasury: address,
        /// Exchange rate (1 SUI = X Naira)
        exchange_rate: u64,
        /// Minimum swap amount in SUI
        min_swap_amount: u64,
        /// Maximum swap amount in SUI
        max_swap_amount: u64,
        /// Transaction counter
        transaction_counter: u64,
    }

    /// Transaction record for tracking swaps
    public struct SwapTransaction has key, store {
        id: UID,
        /// Transaction ID
        tx_id: u64,
        /// User wallet address
        user_address: address,
        /// Swap type: "ON_RAMP" or "OFF_RAMP"
        swap_type: String,
        /// Amount in SUI
        sui_amount: u64,
        /// Amount in Naira
        naira_amount: u64,
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

    /// Treasury object for holding SUI tokens
    public struct Treasury has key {
        id: UID,
        /// Treasury wallet address
        treasury_address: address,
        /// Available SUI balance
        available_balance: u64,
        /// Total SUI deposited
        total_deposited: u64,
        /// Total SUI withdrawn
        total_withdrawn: u64,
    }

    /// Admin capabilities for contract management
    public struct AdminCap has key {
        id: UID,
        admin_address: address,
    }

    // ===== EVENTS =====
    
    public struct SwapInitiated has copy, drop {
        tx_id: u64,
        user_address: address,
        swap_type: String,
        sui_amount: u64,
        naira_amount: u64,
        timestamp: u64,
    }

    public struct PaymentConfirmed has copy, drop {
        tx_id: u64,
        user_address: address,
        payment_reference: String,
        timestamp: u64,
    }

    public struct SwapCompleted has copy, drop {
        tx_id: u64,
        user_address: address,
        swap_type: String,
        sui_amount: u64,
        naira_amount: u64,
        timestamp: u64,
    }

    public struct SwapFailed has copy, drop {
        tx_id: u64,
        user_address: address,
        swap_type: String,
        reason: String,
        timestamp: u64,
    }

    public struct TreasuryReceipt has copy, drop {
        tx_id: u64,
        amount: u64,
        treasury_address: address,
        timestamp: u64,
    }

    // ===== INITIALIZATION =====
    
    /// Initialize the swap contract
    fun init(ctx: &mut TxContext) {
        let admin = tx_context::sender(ctx);
        
        let swap_contract = SwapContract {
            id: object::new(ctx),
            admin,
            paused: false,
            treasury: admin, // Initially admin is treasury
            exchange_rate: 3000, // 1 SUI = 3000 Naira (example rate)
            min_swap_amount: 1, // 1 MIST minimum (temporarily lowered for testing)
            max_swap_amount: 100000000000, // 100 SUI maximum
            transaction_counter: 0,
        };

        let admin_cap = AdminCap {
            id: object::new(ctx),
            admin_address: admin,
        };

        let treasury = Treasury {
            id: object::new(ctx),
            treasury_address: admin,
            available_balance: 0,
            total_deposited: 0,
            total_withdrawn: 0,
        };

        // Transfer ownership to admin
        transfer::share_object(swap_contract);
        transfer::transfer(admin_cap, admin);
        transfer::transfer(treasury, admin);
    }

    // ===== OFF-RAMP: SUI TO NAIRA =====
    
    /// Initiate OFF-RAMP swap (SUI → Naira)
    /// User sends SUI tokens and provides bank details
    public entry fun initiate_off_ramp(
        swap_contract: &mut SwapContract,
        payment: Coin<SUI>,
        bank_account: String,
        bank_name: String,
        ctx: &mut TxContext
    ) {
        assert!(!swap_contract.paused, ESWAP_PAUSED);
        
        let user_address = tx_context::sender(ctx);
        let sui_amount = coin::value(&payment);
        
        // Validate amount
        assert!(sui_amount >= swap_contract.min_swap_amount, EINVALID_AMOUNT);
        assert!(sui_amount <= swap_contract.max_swap_amount, EINVALID_AMOUNT);
        
        // Calculate Naira amount
        let naira_amount = sui_amount * swap_contract.exchange_rate / 1000000000; // Convert from MIST to Naira
        
        // Increment transaction counter
        swap_contract.transaction_counter = swap_contract.transaction_counter + 1;
        let tx_id = swap_contract.transaction_counter;
        
        // Create transaction record
        let transaction = SwapTransaction {
            id: object::new(ctx),
            tx_id,
            user_address,
            swap_type: string::utf8(b"OFF_RAMP"),
            sui_amount,
            naira_amount,
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
        
        // CRITICAL: Transfer SUI to treasury FIRST
        // This ensures the treasury actually receives the tokens before any bank transfer
        // If this transfer fails, the entire transaction will abort
        transfer::public_transfer(payment, swap_contract.treasury);
        
        // Emit treasury receipt event for validation
        event::emit(TreasuryReceipt {
            tx_id,
            amount: sui_amount,
            treasury_address: swap_contract.treasury,
            timestamp: tx_context::epoch_timestamp_ms(ctx),
        });
        
        // Only proceed with transaction recording if treasury validation passes
        // Emit event
        event::emit(SwapInitiated {
            tx_id,
            user_address,
            swap_type: string::utf8(b"OFF_RAMP"),
            sui_amount,
            naira_amount,
            timestamp: tx_context::epoch_timestamp_ms(ctx),
        });
        
        // Transfer transaction record to user (they can track it)
        transfer::transfer(transaction, user_address);
    }

    // ===== ON-RAMP: NAIRA TO SUI =====
    
    /// Initiate ON-RAMP swap (Naira → SUI)
    /// User provides payment source details, SUI will be sent after payment confirmation
    public entry fun initiate_on_ramp(
        swap_contract: &mut SwapContract,
        naira_amount: u64,
        payment_source_account: String,
        payment_source_bank: String,
        payment_source_name: String,
        ctx: &mut TxContext
    ) {
        assert!(!swap_contract.paused, ESWAP_PAUSED);
        
        let user_address = tx_context::sender(ctx);
        
        // Calculate required SUI amount
        let sui_amount = naira_amount * 1000000000 / swap_contract.exchange_rate; // Convert Naira to MIST
        
        // Validate amount
        assert!(sui_amount >= swap_contract.min_swap_amount, EINVALID_AMOUNT);
        assert!(sui_amount <= swap_contract.max_swap_amount, EINVALID_AMOUNT);
        
        // Increment transaction counter
        swap_contract.transaction_counter = swap_contract.transaction_counter + 1;
        let tx_id = swap_contract.transaction_counter;
        
        // Create transaction record
        let transaction = SwapTransaction {
            id: object::new(ctx),
            tx_id,
            user_address,
            swap_type: string::utf8(b"ON_RAMP"),
            sui_amount,
            naira_amount,
            status: string::utf8(b"PENDING"),
            created_at: tx_context::epoch_timestamp_ms(ctx),
            confirmed_at: 0,
            payment_reference: string::utf8(b""), // No payment reference needed
            bank_account: string::utf8(b""),
            bank_name: string::utf8(b""),
            payment_source_account,
            payment_source_bank,
            payment_source_name,
        };
        
        // Emit event
        event::emit(SwapInitiated {
            tx_id,
            user_address,
            swap_type: string::utf8(b"ON_RAMP"),
            sui_amount,
            naira_amount,
            timestamp: tx_context::epoch_timestamp_ms(ctx),
        });
        
        // Transfer transaction record to user
        transfer::transfer(transaction, user_address);
    }

    // ===== ADMIN FUNCTIONS =====
    
    /// Confirm ON-RAMP payment and send SUI to user
    /// Only admin can call this function
    public entry fun confirm_on_ramp_payment(
        swap_contract: &mut SwapContract,
        treasury: &mut Treasury,
        transaction: &mut SwapTransaction,
        mut payment: Coin<SUI>,
        admin_cap: &AdminCap,
        ctx: &mut TxContext
    ) {
        // Verify admin authorization
        assert!(tx_context::sender(ctx) == admin_cap.admin_address, EUNAUTHORIZED);
        assert!(!swap_contract.paused, ESWAP_PAUSED);
        
        // Verify transaction is pending ON-RAMP
        assert!(string::as_bytes(&transaction.swap_type) == b"ON_RAMP", EINVALID_AMOUNT);
        assert!(string::as_bytes(&transaction.status) == b"PENDING", ETRANSACTION_ALREADY_PROCESSED);
        
        let sui_amount = coin::value(&payment);
        assert!(sui_amount >= transaction.sui_amount, EINSUFFICIENT_BALANCE);
        
        // Update transaction status
        transaction.status = string::utf8(b"CONFIRMED");
        transaction.confirmed_at = tx_context::epoch_timestamp_ms(ctx);
        
        // Update treasury
        treasury.available_balance = treasury.available_balance - transaction.sui_amount;
        treasury.total_withdrawn = treasury.total_withdrawn + transaction.sui_amount;
        
        // Create exact amount coin for user
        let user_payment = coin::split(&mut payment, transaction.sui_amount, ctx);
        
        // Transfer SUI to user
        transfer::public_transfer(user_payment, transaction.user_address);
        
        // Consume remaining payment by transferring to treasury
        transfer::public_transfer(payment, swap_contract.treasury);
        
        // Update transaction status to completed
        transaction.status = string::utf8(b"COMPLETED");
        
        // Emit events
        event::emit(PaymentConfirmed {
            tx_id: transaction.tx_id,
            user_address: transaction.user_address,
            payment_reference: transaction.payment_reference,
            timestamp: tx_context::epoch_timestamp_ms(ctx),
        });
        
        event::emit(SwapCompleted {
            tx_id: transaction.tx_id,
            user_address: transaction.user_address,
            swap_type: transaction.swap_type,
            sui_amount: transaction.sui_amount,
            naira_amount: transaction.naira_amount,
            timestamp: tx_context::epoch_timestamp_ms(ctx),
        });
    }

    /// Process OFF-RAMP completion (after Naira is sent to user's bank)
    /// Only admin can call this function
    public entry fun complete_off_ramp(
        swap_contract: &mut SwapContract,
        transaction: &mut SwapTransaction,
        admin_cap: &AdminCap,
        ctx: &mut TxContext
    ) {
        // Verify admin authorization
        assert!(tx_context::sender(ctx) == admin_cap.admin_address, EUNAUTHORIZED);
        assert!(!swap_contract.paused, ESWAP_PAUSED);
        
        // Verify transaction is pending OFF-RAMP
        assert!(string::as_bytes(&transaction.swap_type) == b"OFF_RAMP", EINVALID_AMOUNT);
        assert!(string::as_bytes(&transaction.status) == b"PENDING", ETRANSACTION_ALREADY_PROCESSED);
        
        // Update transaction status
        transaction.status = string::utf8(b"COMPLETED");
        transaction.confirmed_at = tx_context::epoch_timestamp_ms(ctx);
        
        // Emit event
        event::emit(SwapCompleted {
            tx_id: transaction.tx_id,
            user_address: transaction.user_address,
            swap_type: transaction.swap_type,
            sui_amount: transaction.sui_amount,
            naira_amount: transaction.naira_amount,
            timestamp: tx_context::epoch_timestamp_ms(ctx),
        });
    }

    /// Deposit SUI to treasury
    public entry fun deposit_to_treasury(
        treasury: &mut Treasury,
        payment: Coin<SUI>,
        _ctx: &mut TxContext
    ) {
        let amount = coin::value(&payment);
        treasury.available_balance = treasury.available_balance + amount;
        treasury.total_deposited = treasury.total_deposited + amount;
        transfer::public_transfer(payment, treasury.treasury_address);
    }

    // ===== ADMIN MANAGEMENT FUNCTIONS =====
    
    /// Pause the swap contract
    public entry fun pause_contract(
        swap_contract: &mut SwapContract,
        admin_cap: &AdminCap,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == admin_cap.admin_address, EUNAUTHORIZED);
        swap_contract.paused = true;
    }

    /// Unpause the swap contract
    public entry fun unpause_contract(
        swap_contract: &mut SwapContract,
        admin_cap: &AdminCap,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == admin_cap.admin_address, EUNAUTHORIZED);
        swap_contract.paused = false;
    }

    /// Update exchange rate
    public entry fun update_exchange_rate(
        swap_contract: &mut SwapContract,
        new_rate: u64,
        admin_cap: &AdminCap,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == admin_cap.admin_address, EUNAUTHORIZED);
        assert!(new_rate > 0, EINVALID_AMOUNT);
        swap_contract.exchange_rate = new_rate;
    }

    /// Update swap limits
    public entry fun update_swap_limits(
        swap_contract: &mut SwapContract,
        min_amount: u64,
        max_amount: u64,
        admin_cap: &AdminCap,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == admin_cap.admin_address, EUNAUTHORIZED);
        assert!(min_amount > 0 && max_amount > min_amount, EINVALID_AMOUNT);
        swap_contract.min_swap_amount = min_amount;
        swap_contract.max_swap_amount = max_amount;
    }

    /// Update treasury address
    public entry fun update_treasury_address(
        swap_contract: &mut SwapContract,
        new_treasury: address,
        admin_cap: &AdminCap,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == admin_cap.admin_address, EUNAUTHORIZED);
        swap_contract.treasury = new_treasury;
    }

    // ===== VIEW FUNCTIONS =====
    
    /// Get contract information
    public fun get_contract_info(swap_contract: &SwapContract): (address, bool, address, u64, u64, u64, u64) {
        (
            swap_contract.admin,
            swap_contract.paused,
            swap_contract.treasury,
            swap_contract.exchange_rate,
            swap_contract.min_swap_amount,
            swap_contract.max_swap_amount,
            swap_contract.transaction_counter,
        )
    }

    /// Get transaction information
    public fun get_transaction_info(transaction: &SwapTransaction): (u64, address, String, u64, u64, String, u64, u64, String, String, String) {
        (
            transaction.tx_id,
            transaction.user_address,
            transaction.swap_type,
            transaction.sui_amount,
            transaction.naira_amount,
            transaction.status,
            transaction.created_at,
            transaction.confirmed_at,
            transaction.payment_reference,
            transaction.bank_account,
            transaction.bank_name,
        )
    }

    /// Get treasury information
    public fun get_treasury_info(treasury: &Treasury): (address, u64, u64, u64) {
        (
            treasury.treasury_address,
            treasury.available_balance,
            treasury.total_deposited,
            treasury.total_withdrawn,
        )
    }
}
