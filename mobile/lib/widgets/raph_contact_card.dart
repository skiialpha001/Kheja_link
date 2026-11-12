import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../config/theme.dart';

/// Public Kheja_Link inquiries contact. Landlord numbers remain in UnlockCard,
/// which shows them only after the database confirms a paid unlock.
class RaphContactCard extends StatelessWidget {
  const RaphContactCard({super.key, required this.propertyTitle});

  final String propertyTitle;

  static const _phone = '+254710655709';
  static const _whatsappNumber = '254710655709';

  Future<void> _open(BuildContext context, Uri uri, String failure) async {
    final opened = await launchUrl(uri, mode: LaunchMode.externalApplication);
    if (!opened && context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(failure)),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final message = Uri.encodeComponent(
      'Hello Raph, I have a question about $propertyTitle on Kheja_Link.',
    );
    final whatsappUri = Uri.parse(
      'https://wa.me/$_whatsappNumber?text=$message',
    );

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: KhejaColors.blue.withValues(alpha: 0.07),
        borderRadius: BorderRadius.circular(KhejaRadius.xl),
        border: Border.all(color: KhejaColors.blue.withValues(alpha: 0.24)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'DIRECT INQUIRIES',
            style: kEyebrowStyle.copyWith(color: KhejaColors.blue),
          ),
          const SizedBox(height: 7),
          Text('Talk to Raph', style: theme.textTheme.titleMedium),
          const SizedBox(height: 4),
          Text(
            'Ask about this listing or get help from Kheja_Link.',
            style: theme.textTheme.bodySmall?.copyWith(
              color: KhejaColors.zinc500,
              height: 1.45,
            ),
          ),
          const SizedBox(height: 7),
          const Text(
            '+254 710 655 709',
            style: TextStyle(fontSize: 13, fontWeight: FontWeight.w800),
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              Expanded(
                child: FilledButton.icon(
                  onPressed: () => _open(
                    context,
                    Uri(scheme: 'tel', path: _phone),
                    'Could not open the phone app.',
                  ),
                  icon: const Icon(Icons.call_rounded, size: 18),
                  label: const Text('Call Raph'),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () => _open(
                    context,
                    whatsappUri,
                    'Could not open WhatsApp.',
                  ),
                  icon: const Icon(Icons.chat_bubble_outline_rounded, size: 18),
                  label: const Text('WhatsApp'),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
